import { Transform } from "stream"
import split2 from "split2"

class LineError extends Error {
  constructor(message, column) {
    super(message)
    this.column = column
  }
}

class PicaLineReader extends Transform {
  constructor(options = {}) {
    super({ objectMode: true })
    this.format = options.format
    this.emptySubfields = options.emptySubfields
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
      throw new LineError("Expected PICA annotation", 1)
    }
  }

  checkOccurrence(field) {
    const level = field[0].charAt(0) 
    const occurrence = field[1]
    if (level === "2") {
      if (!occurrence) { 
        throw new LineError("Missing occurrence on level 2", 5)
      }
    } else {
      if (occurrence && occurrence.length != 2) {
        throw new LineError("Occurrence must be two digits", 6)
      }
    }
  }

  parsePlain(line) {
    const match = line.match(/^(([012][0-9][0-9][A-Z@])(\/([0-9]{2,3}))?)(.*)/)
    if (!match) {
      throw new LineError("Malformed tag/occurrence", 1)
    }
    const indent = match[1].length
    const field = [match[2], match[4] && /[^0]/.test(match[4]) ? match[4] : ""]
    this.checkOccurrence(field)

    if (match[5].charAt(0) !== " ") {
      throw new LineError("Expected space character", indent+1)
    }
    if (match[5].charAt(1) != "$") {
      throw new LineError("Expected subfield indicator '$'", indent+2)
    }
    if (match[5].substr(-1) === "$") {
      throw new LineError("Expected subfield code", line.length+1)
    }

    const subfields = match[5].substr(1)
    for (let m of subfields.matchAll(/\$([^$])((?:[^$]+|\$\$)*)/g)) {
      const code = m[1]
      if (!code.match(/^[A-Za-z0-9]$/)) {
        throw new LineError(`Invalid subfield code '${code}'`, indent + m.index + 3)
      }
      field.push(code, m[2].replace(/\$\$/g, "$"))
    }

    return field
  }

  parseField(line) {
    switch(this.format) {
      case "annotated":
        return this.parseAnnotated(line)
      case "plain":
        return this.parsePlain(line)
      default:
        throw new Error(`PICA serialization ${this.format} not supported.`)
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
    // TODO: support annotated, import (\x1E or \x1D before each line) and plus format 
    if (data === "") {
      this.finishRecord()
      callback()
    } else {
      try {
        this.record.push(this.parseField(data))
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
  if (typeof options !== "object") {
    options = { format: options }
  }
  const { format } = options
  if (format === "plain" || format === "annotated" || format === "plus" || format === "import") {
    return input.pipe(split2("\n")).pipe(new PicaLineReader(options))
  } else {
    throw new Error(`Unknown PICA serialization format: '${format}'`)
  }
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
