import assert from "assert"
import { serializePica, parsePica, PicaPath, getPPN } from "../src/pica.js"

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
  })
})

describe("PicaPath", () => {
  const pathTests = {
    "003@": { tag: /^003@$/, occ: null, sf: null },
    "003@$0": { tag: /^003@$/, occ: null, subfieldString: "0"},
    "045Q[01-09]$a": {
      tag: /^045Q$/, occ: "01,09",
      startOccurrence: "01",
      endOccurrence: "09",
      occurrenceString: "01-09",
      subfieldString: "a",
    },
    "045G$a": { tag: /^045G$/, occ: null, subfieldString: "a"},
  }

  it("stringify path expressions", () => {
    for (const [expr, expect] of Object.entries(pathTests)) {
      const path = new PicaPath(expr)
      for (let key in expect) {
        assert.equal(String(path[key]), String(expect[key]))
      }
    }
  })
})
