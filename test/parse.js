import chai from "chai"
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)
const { expect } = chai

import fs from "fs"
import path from "path"

const __dirname = new URL(".", import.meta.url).pathname // eslint-disable-line no-undef
const tests = JSON.parse(fs.readFileSync(path.resolve(__dirname, "pica.json")))

import { parsePica, serializePica, parseAll } from "../lib/pica.js"
import { Readable } from "stream"

describe("parsePica", () => {
  tests.forEach(({ input, format, result, description, error, serialize }) => {
    description = description || `parse PICA ${format}`
    if (format !== "x") { // FIXME
      it( (description + (error ? " with error" : "")), async () => {
        const records = parsePica(input, { format })
        if (error) {
          expect(records).deep.equal([])
          expect(() => parsePica(input, { format, error: true })).to.throw()
        } else {
          expect(records).deep.equal(result)
          if (serialize && result.length == 1) {
            for (let format in serialize) {                
              expect(serializePica(result[0], format)).to.equal(serialize[format])
            }
          }
        }
      })
    }
  })
})

describe("parseAll", () => {
  tests.forEach(({ input, format, result, description, error }) => {
    description = description || `parse PICA ${format}`
    it( (description + (error ? " with error" : "")), async () => {
      const parsed = parseAll(Readable.from(input), { format })
      if (error) {
        return parsed 
          .then(() => { throw new Error("expected error") })
          .catch(e => {
            expect({ message: e.message, ...e }).deep.equal(error) 
          })
      } else {
        return expect(parsed).become(result)
      }
    })
  })

  it("accepts format given as plain string", async () => {
    return expect(parseAll(Readable.from("~ 003@ $0123"), "annotated"))
      .become([[["003@","","0","123","~"]]])
  })
})
