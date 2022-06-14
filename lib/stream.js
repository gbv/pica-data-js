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
    this.format = options.format
    if (!/^(plain|annotated|normalized)$/.test(this.format)) {
      throw new Error(`PICA serialization '${this.format}' is not supported`)
    }
    this.emptySubfields = options.emptySubfields // TODO: respect this
    this.line = 0
    this.record = []
  }

  parseAnnotated(line) {
    const annotation = line.charAt(0)
    if (/^[^A-Za-z0-9] /.test(line)) {
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

    if (match[5].charAt(0) !== " ") {
      throw new PicaParseError("Expected space character", subfieldPos)
    }
    if (match[5].charAt(1) != subfieldIndicator) {
      throw new PicaParseError("Expected subfield indicator", subfieldPos + 1)
    }
    if (match[5].substr(-1) === subfieldIndicator) {
      throw new PicaParseError("Expected subfield code", line.length + 1)
    }

    return [ field, subfieldPos ]
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

      const [ field, subfieldPos ] = this.parseField(part, "\x1F")
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
      record.push(field)
    }
    if (fields[fields.length-1] !== "") {
      throw new PicaParseError("Expected field separator", line.length+1)
    }
    return record
  }

  parseLine(line) {
    switch(this.format) {
      case "annotated":
        return this.parseAnnotated(line)
      case "plain":
        return this.parsePlain(line)
      case "normalized":
        return this.parseNormalized(line)
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
    const normalized = this.format === "normalized"
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
