import assert from "assert"
import { picaFieldSchedule, picaFieldScheduleIdentifier, serializePicaField, isDbkey, isPPN, ppnChecksum } from "../src/pica.js"
import { loadJSON } from "./utils.js"

const schema = loadJSON("schema")

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

  const tests = [
    { field: ["003@", null], id: "003@" },
    { field: ["003@", "01"], id: null },
    { field: ["209A", "1", "x", "11"], id: "209Ax10-19" },
    { field: ["209A", "1", "x", "20"], id: null },
    { field: ["209B", "123", "x", "01"], id: "209Bx01" },
  ]
  for(let { field, id } of tests) {
    it(serializePicaField(field) + " →  " + id, () => {
      assert.equal(picaFieldScheduleIdentifier(schema, field), id)
    })
  }
})

describe("isDbkey", () => {
  it("detects invalid dbkey", () => {
    for (let dbkey of [null, "", "a-", "-a","9"]) {
      assert.ok(!isDbkey(dbkey))
    }
  })
  it("detects valid dbkey", () => {
    for (let dbkey of ["ab","a9-1", "ab-b1e-ef"]) {
      assert.ok(isDbkey(dbkey))
    }
  })
})

describe("isPPN", () => {
  it("detects valid PPN with checksum", () => {
    for (let ppn of ["043107419","1747808938","271389869","95980479X","741769247"]) {
      assert.ok(isPPN(ppn))
      assert.equal(ppnChecksum(ppn.slice(0,-1)), ppn.slice(-1))
    }
  })
  it("detects invalid ppn", () => {
    for (let ppn of [null, "ab123", "", "1","1X","959804790"]) {
      assert.ok(!isPPN(ppn))
    }
  })
})
