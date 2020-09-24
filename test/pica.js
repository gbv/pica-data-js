import assert from "assert"
import { serializePica, serializePica3, parsePica, getPPN, picaFieldIdentifier } from "../src/pica.js"
import { loadJSON } from "./utils.js"

describe("Parsing and serializing PICA Plain", () => {
  const parseTests = {
    "003@ $0123": [ [ "003@", null, "0", "123" ] ],
    "001X $a1\n234@/99 $b$$x$$$c0": [
      ["001X", null, "a", "1" ],
      ["234@", "99", "b", "$x$", "c", "0" ],
    ],
  }

  it("parses and serializes", () => {
    for (let pp in parseTests) {
      const pica = parsePica(pp)
      assert.deepEqual(pica, parseTests[pp])
      assert.equal(serializePica(pica), pp)
    }
  })
})

describe("Utility functions", () => {
  it("getPPN", () => {
    assert.equal(getPPN(parsePica("003@ $0123")), "123")
    assert.equal(getPPN(parsePica("003@ $0123$0456")), "123")
    assert.equal(getPPN(parsePica("001X $a1\n234@/99 $b$$x$$$c0")), null)
  }),
  it("picaFieldIdentifier", () => {
    assert.equal(picaFieldIdentifier(["123A","01"]), "123A/01")
    assert.equal(picaFieldIdentifier({tag:"023A"}), "023A")
    assert.equal(picaFieldIdentifier({tag:"023A",occurrence:"02"}), "023A/02")
    assert.equal(picaFieldIdentifier({tag:"201A",counter:"00"}), "201Ax00")
    assert.equal(picaFieldIdentifier(["201A","123","x","00"]), "201Ax00/123")
  })
})

describe("serialize Pica3", () => {
  const schema = loadJSON("schema")
  const pica3tests = loadJSON("pica3tests")

  pica3tests.forEach( ({ plain, pica3 }) => {
    it(plain + " →  " + pica3, () => {
      const record = parsePica(plain)
      assert.equal(serializePica3(record, schema), pica3)
    })
  })

})
