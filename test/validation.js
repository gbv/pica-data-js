import assert from "assert"
import { picaFieldSchedule, picaFieldScheduleIdentifier, serializePicaField } from "../src/pica.js"
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
