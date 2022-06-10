import { Transform } from "stream"
import split2 from "split2"
import { parsePicaLine } from "./parse.js"

class PlainReader extends Transform {
  // TODO: support parsing annoted PICA { annotated: true|false }
  constructor() {
    super({ objectMode: true })
    this.line = 0
    this.record = []
  }

  finishRecord() {
    if (this.record.length > 0) {
      this.push(this.record)
      this.record = []
    }
  }

  _transform(line, encoding, callback) {
    this.line++
    if (line === "") {
      this.finishRecord()
      callback()
    } else {
      // TODO: more precise error messages
      const field = parsePicaLine(line)
      if (field) {
        this.record.push(field)
        callback()
      } else {
        callback({
          message: "Invalid PICA Plain syntax",
          line: this.line,
          data: line,
        })
      }
    }
  }

  _final() {
    this.finishRecord()
    super._final()
  }
}

export function parseStream(input, format) {  
  if (format === "plain") {
    return input.pipe(split2("\n")).pipe(new PlainReader())
  } else {
    throw new Error(`Unknown PICA serialization format: '${format}'`)
  }
}

export async function parseAll(input, format) {
  const stream = parseStream(input, format)
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
