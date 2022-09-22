import { Transform } from "stream"
import split2 from "split2"

class PicaParseError extends Error {
  constructor(message, column) {
    super(message)
    this.column = column
  }
}

export class PicaLineReader extends Transform {
  constructor(options = {}) {
    super({ objectMode: true })
    const { format, emptySubfields } = options
    if (!/^(plain|annotated|normalized|patch-plain|patch-normalized)$/.test(format)) {
      throw new Error(`PICA serialization '${format}' is not supported`)
    }
    this.format = format
    if (format === "patch-plain") {
      this.annotationChars = /[ +-]/
    } else if (format === "annotated") {
      this.annotationChars=/[^A-Za-z0-9]/
    }
    this.emptySubfields = emptySubfields // TODO: respect this
    this.line = 0
    this.record = []
  }

  parseAnnotated(line) {
    const annotation = line.charAt(0)
    if (line.charAt(1) === " " && this.annotationChars.test(annotation)) {
      try {
        const field = this.parsePlain(line.substr(2))
        field.push(annotation)
        return field
      } catch(e) {
        e.column += 2
        throw(e)
      }
    } else {
      throw new PicaParseError("Expected PICA annotation", 1)
    }
  }

  parseField(line, subfieldIndicator) {
    const match = line.match(/^(([012][0-9][0-9][A-Z@])(\/([0-9]{2,3}))?)(.*)/)
    if (!match) {
      throw new PicaParseError("Malformed tag/occurrence", 1)
    }
    const subfieldPos = match[1].length + 1
    const occurrence = match[4] && /[^0]/.test(match[4]) ? match[4] : ""
    const field = [match[2], occurrence]
    const level = field[0].charAt(0) 

    if (level === "2") {
      if (!occurrence) { 
        throw new PicaParseError("Missing occurrence on level 2", 5)
      }
    } else {
      if (occurrence && occurrence.length != 2) {
        throw new PicaParseError("Occurrence must be two digits", 6)
      }
    }

    var annotation
    const sep = match[5].charAt(0)
    if (this.format === "patch-normalized") {
      if (/[ +-]/.test(sep)) {
        annotation = sep
      } else {
        throw new PicaParseError("Expected annotation character", subfieldPos)
      }
    } else if (sep !== " ") {
      throw new PicaParseError("Expected space character", subfieldPos)
    }
    if (match[5].charAt(1) != subfieldIndicator) {
      throw new PicaParseError("Expected subfield indicator", subfieldPos + 1)
    }
    if (match[5].substr(-1) === subfieldIndicator) {
      throw new PicaParseError("Expected subfield code", line.length + 1)
    }

    return [ field, subfieldPos, annotation ]
  }

  parsePlain(line) {
    const [ field, pos ] = this.parseField(line, "$")

    for (let m of line.substr(pos).matchAll(/\$([^$])((?:[^$]+|\$\$)*)/g)) {
      const code = m[1]
      if (!code.match(/^[A-Za-z0-9]$/)) {
        throw new PicaParseError(`Invalid subfield code '${code}'`, pos + m.index + 2)
      }
      field.push(code, m[2].replace(/\$\$/g, "$"))
    }

    return field
  }

  parseNormalized(line) {
    const record = []
    const fields = line.split("\x1E")
    for (let i=0, fieldPos=0; i<fields.length; i++) {
      const part = fields[i]

      if (part == "" && i == fields.length-1) {
        continue
      }

      const [ field, subfieldPos, annotation ] = this.parseField(part, "\x1F")
      const subfields = part.substr(subfieldPos+1).split("\x1F")

      var pos = fieldPos + subfieldPos
      subfields.forEach(m => {
        const code = m.charAt(0)
        const value = m.substr(1)
        if (!code.match(/^[A-Za-z0-9]$/)) {
          throw new PicaParseError(`Invalid subfield code '${code}'`, pos + 2)
        }
        field.push(code, value)
        pos += m.length+1
      })

      fieldPos += part.length
      if (annotation !== undefined) {
        field.push(annotation)
      }
      record.push(field)
    }
    if (fields[fields.length-1] !== "") {
      throw new PicaParseError("Expected field separator", line.length+1)
    }

    return record
  }

  parseLine(line) {
    switch(this.format) {
      case "plain":
        return this.parsePlain(line)
      case "normalized":
      case "patch-normalized":
        return this.parseNormalized(line)
      case "annotated":
      case "patch-plain":
        return this.parseAnnotated(line)
    }
  }

  finishRecord() {
    if (this.record.length > 0) {
      this.push(this.record)
      this.record = []
    }
  }

  _transform(data, encoding, callback) {
    this.line++
    const normalized = /^(.+-)?normalized/.test(this.format)
    if (data === "" && !normalized) {
      this.finishRecord()
      callback()
    } else {
      try {
        if (normalized) {
          this.push(this.parseLine(data))
        } else {
          this.record.push(this.parseLine(data))
        }
        callback()
      } catch(error) {
        error.line = this.line
        callback(error)
      }
    }
  }

  _final() {
    this.finishRecord()
    super._final()
  }
}

export function parseStream(input, options={}) {
  if (typeof options === "string") {
    options = { format: options }
  }
  return input.pipe(split2("\n")).pipe(new PicaLineReader(options))
}

export async function parseAll(input, options) {
  const stream = parseStream(input, options)
  return new Promise((resolve, reject) => {
    if (!stream.readable) return resolve([])

    var result = []

    stream.on("data", onData)
    stream.on("end", onEnd)
    stream.on("error", onEnd)
    stream.on("close", onClose)

    function onData(data) {
      result.push(data)
    }

    function onEnd(err) {
      if (err) reject(err)
      else resolve(result)
      cleanup()
    }

    function onClose() {
      resolve(result)
      cleanup()
    }

    function cleanup() {
      result = null
      stream.removeListener("data", onData)
      stream.removeListener("end", onEnd)
      stream.removeListener("error", onEnd)
      stream.removeListener("close", onClose)
    }
  })
}

// returns a record in normalized or a field in plain syntax
export const parsePicaLine = (line, options={}) => {    
  const reader = new PicaLineReader(options)
  if (options.error) {
    return reader.parseLine(line)
  } else {
    try {
      return reader.parseLine(line)
    } catch(e) {
      return
    }
  }
}

// returns an array of records
export const parsePica = (text, options={}) => {
  const lines = text.split(/\n/)

  if (!options.format) {
    options.format = "plain"
  }

  // TODO: avoid code duplication in _transform above
  const normalized = /^(.+-)?normalized/.test(options.format)

  if (normalized) { // one record per line
    return lines.map(line => parsePicaLine(line, options)).filter(Boolean)
  } else { // one field per line
    const reader = new PicaLineReader(options)
    const result = []
    var record = []
    for (let line of lines) {
      if (line === "") {
        if (record.length) {
          result.push(record)
        }
        record = []
      } else {
        try {
          record.push(reader.parseLine(line))
        } catch(e) {
          if (options.error) {
            throw e
          } else {
            record = [] // skip-invalid records
          }
        }
      }
    }
    if (record.length) {
      result.push(record)
    }
    return result
  }
}
