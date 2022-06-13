import chai from "chai"
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)
const { expect } = chai

import { parseAll } from "../lib/stream.js"
import { Readable } from "stream"

// TODO: move tests to file
const parseTests = [
  {
    input: "031N $d$e1$f",
    format: "plain",
    result: [ [ [ "031N", "", "d", "", "e", "1", "f", "" ] ] ],
  },
  {
    input: "012X/00 $a",
    format: "plain",
    result: [ [ ["012X", "", "a", ""] ] ],
    description: "normalize occurrence zero",
  },
  { 
    input: "003@ $0123\n\n001X $a1\n234@/99 $b$$x$$$c0",
    format: "plain",
    description: "multiple records",
    result: [ 
      [ [ "003@", "", "0", "123" ] ],
      [
        ["001X", "", "a", "1" ],
        ["234@", "99", "b", "$x$", "c", "0" ],
      ],
    ],
  },
  {
    input: "+ 031N $d$e1$f",
    format: "annotated",
    description: "annotated PICA",
    result: [ [ [ "031N", "", "d", "", "e", "1", "f", "", "+" ] ] ],
  },
  {
    input: "003/001 $a",
    format: "plain",
    error: { message: "Malformed tag/occurrence", line: 1, column: 1 },
  },
  {
    input: "001X $",
    format: "plain",
    error: { message: "Expected subfield code", line: 1, column: 7 },
  },
  {
    input: "001X $a1$_2",
    format: "plain",
    error: { message: "Invalid subfield code '_'", line: 1, column: 10 },
  },
  {
    input: "003@ $0\n123X/123",
    format: "plain",
    error: { message: "Occurrence must be two digits", line: 2, column: 6 },
  },
  {
    input: "123Z/07",
    format: "plain",
    error: { message: "Expected space character" , line: 1, column: 8 },
  },
  {
    input: "? 111A A",
    format: "annotated",
    error: { message: "Expected subfield indicator '$'" , line: 1, column: 8 },
  },
  {
    input: "003@ $0",
    format: "annotated",
    error: { message: "Expected PICA annotation", line: 1, column: 1 },
  },
  {
    input: "+ 200A/00",
    format: "annotated",
    error: { message: "Missing occurrence on level 2", line: 1, column: 7 },
  },
]

describe("parseAll", () => {
  parseTests.forEach(({ input, format, result, description, error }) => {
    it( (description || "parse"), async () => {
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
