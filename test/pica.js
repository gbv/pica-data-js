import assert from "assert"
import { serializePica3, parsePica, getPPN, picaFieldIdentifier } from "../lib/pica.js"
import { loadJSON } from "./utils.js"

describe("Utility functions", () => {
  it("getPPN", () => {
    assert.equal(getPPN(parsePica("003@ $0123")[0]), "123")
    assert.equal(getPPN(parsePica("003@ $0123$0456")[0]), "123")
    assert.equal(getPPN(parsePica("001X $a1\n234@/99 $b$$x$$$c0")[0]), null)
  }),
  it("picaFieldIdentifier", () => {
    assert.equal(picaFieldIdentifier(["123A","01"]), "123A/01")
    assert.equal(picaFieldIdentifier({tag:"023A"}), "023A")
    assert.equal(picaFieldIdentifier({tag:"023A",occurrence:"02"}), "023A/02")
    assert.equal(picaFieldIdentifier({tag:"201A",counter:"00"}), "201Ax00")
    assert.equal(picaFieldIdentifier(["201A","123","x","00"]), "201A/123")
  })
})

describe("serialize Pica3", () => {
  const schema = loadJSON("schema")
  const pica3tests = loadJSON("pica3tests")

  pica3tests.forEach( ({ plain, pica3 }) => {
    it(plain + " →  " + pica3, () => {
      const [record] = parsePica(plain)
      assert.equal(serializePica3(record, schema), pica3)
    })
  })
})
