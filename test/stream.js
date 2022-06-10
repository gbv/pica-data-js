import chai from "chai"
import chaiAsPromised from "chai-as-promised"
chai.use(chaiAsPromised)
const { expect } = chai

import { parseAll } from "../lib/stream.js"
import { Readable } from "stream"

// TODO: don't duplicate test cases
const parseTests = [
  {
    input: "031N $d$e1$f",
    result: [ [ [ "031N", "", "d", "", "e", "1", "f", "" ] ] ],
  },
  {
    input: "012X/00 $a",
    result: [ [ ["012X", "", "a", ""] ] ],
    description: "normalize occurrence zero",
  },
  { 
    input: "003@ $0123\n\n001X $a1\n234@/99 $b$$x$$$c0",
    description: "multiple records",
    result: [ 
      [ [ "003@", "", "0", "123" ] ],
      [
        ["001X", "", "a", "1" ],
        ["234@", "99", "b", "$x$", "c", "0" ],
      ],
    ],
  },
]

describe("parseAll", () => {
  parseTests.forEach(({ input, format, result, description }) => {
    it( (description || "parse"), async () => {
      return parseAll(Readable.from(input), format || "plain")
        .then(records => expect(records).deep.equal(result))
    })
  })
})
