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
  }
}

function parseStream(input, format) {  
  if (format === "plain") {
    return input.pipe(split2("\n")).pipe(new PlainReader())
  } else {
    throw new Error(`Unknown PICA serialization format: '${format}'`)
  }
}

export default parseStream
