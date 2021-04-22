import assert from "assert"
import { serializePica, serializePica3, parsePica, getPPN, picaFieldIdentifier } from "../src/pica.js"
import { loadJSON } from "./utils.js"

describe("Parsing and serializing PICA Plain", () => {
  const parseTests = tests => {
    for (let pp in tests) {
      const pica = parsePica(pp)
      assert.deepEqual(pica, tests[pp])
      assert.equal(serializePica(pica), pp)
    }
  }

  it("parses and serializes", () => {
    parseTests({
      "003@ $0123": [ [ "003@", null, "0", "123" ] ],
      "001X $a1\n234@/99 $b$$x$$$c0": [
        ["001X", null, "a", "1" ],
        ["234@", "99", "b", "$x$", "c", "0" ],
      ],
    })
  })

  it("does not support empty (sub)fields", () => {
    assert.deepEqual(parsePica("099X $ab$"), [])
    assert.deepEqual(parsePica("099X $"), [])
    assert.deepEqual(parsePica("099X"), [])
  })
    
  it("supports parsing and serializing annotated PICA", () => {
    parseTests({
      "  123A $xy": [["123A",null,"x","y"," "]],
      "? 123A $xy": [["123A",null,"x","y","?"]],
    })
    assert.equal(serializePica([["123A",null,"x","y",null]]), "  123A $xy")

    assert.deepEqual(parsePica("  123A $xy", { annotated: false }), [])
    assert.deepEqual(parsePica("123A $xy", { annotated: true }), [])

    assert.deepEqual(serializePica([["123A",null,"x","y"," "]], { annotated: false }), "123A $xy")
    assert.deepEqual(serializePica([["123A",null,"x","y"]], { annotated: true }), "  123A $xy")
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
    assert.equal(picaFieldIdentifier(["201A","123","x","00"]), "201A/123")
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
