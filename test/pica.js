import assert from "assert"
import { serializePica, serializePica3, parsePica, PicaPath, getPPN, picaFieldIdentifier, picaFieldSchedule, picaFieldScheduleIdentifier } from "../src/pica.js"
import { readFileSync } from "fs"

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

describe("picaFieldSchedule", () => {
  it("can handle missing arguments", () => {
    assert.equal(picaFieldSchedule(null, null), null)
    assert.equal(picaFieldSchedule({}, ["003@"]), null)
  })
})

describe("picaFieldScheduleIdentifier", () => {
  it("filters undefined field", () => {
    const schema = {fields:{}}
    const field = ["003@",null]
    assert.equal(picaFieldScheduleIdentifier(schema, field), null)
  })
})

const loadJSON = file => JSON.parse(readFileSync("./test/" + file, "utf8"))

describe("serialize Pica3", () => {
  const schema = loadJSON("schema.json")
  const pica3tests = loadJSON("pica3tests.json")

  pica3tests.forEach( ({ plain, pica3 }) => {
    it(plain + " →  " + pica3, () => {
      const record = parsePica(plain)
      assert.equal(serializePica3(record, schema), pica3)
    })
  })

})
