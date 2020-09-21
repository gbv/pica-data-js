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
    "003@": { tagString: "003@" },
    "003@$0": { tagString: "003@", subfieldString: "0"},
    "045Q[01-09]$a": {
      toString: "045Q/01-09$a",
      tagString: "045Q",
      startOccurrence: "01",
      endOccurrence: "09",
      occurrenceString: "01-09",
      subfieldString: "a",
    },
    "045G$a": { tagString: "045G", subfieldString: "a"},
  }

  it("stringify path expressions", () => {
    for (const [expr, expect] of Object.entries(pathTests)) {
      const path = new PicaPath(expr)
      if (!("toString" in expect)) {
        assert.equal(path.toString(), expr)
      }
      for (let accessor in expect) {
        assert.equal(path[accessor](), expect[accessor])
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
