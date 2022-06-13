import chai from "chai"
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)
const { expect } = chai

import fs from "fs"
import path from "path"

import { URL } from "url"
const __dirname = new URL(".", import.meta.url).pathname
const file = name => path.resolve(__dirname, name)
const readFile = path => fs.readFileSync(file(path))
const jsonFile = path => JSON.parse(readFile(path))

import { parseAll } from "../lib/stream.js"
import { Readable } from "stream"

describe("parseAll", () => {
  jsonFile("pica.json").forEach(({ input, format, result, description, error }) => {
    it( (description || `parse PICA ${format}`), async () => {
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
})
