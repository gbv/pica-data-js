import assert from "assert"
import { PicaPath } from "../src/pica.js"

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
