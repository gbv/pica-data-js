/**
 * PICA data processing module.
 */

// parsing and serializing PICA+ <-> PICA/JSON

export const picaFieldIdentifier = field => {
  if (typeof field !== "object") return

  const [tag, occ] = Array.isArray(field) ? field : [ field.tag, field.occurrence ]
  const counter = Array.isArray(field) ? null : field.counter

  return tag 
    + (counter ? "x" + counter : "")
    + (occ ? "/" + (occ.length === 1 ? "0" + occ : occ) : "")
}

function subfieldValue(field, code) {
  for(var i=2; i<field.length; i+=2) {
    if (field[i] === code) return field[i+1]
  }
}

export const serializePicaField = (field, options) => {
  const annotated = (options||{}).annotated

  var annotation = ""
  var subfields

  if (field.length % 2 && field.length > 2) {
    if (annotated !== false) {
      annotation = (field.slice(-1)[0] || " ") + " "
    }
    subfields  = field.slice(2,-1)
  } else {
    if (annotated === true) {
      annotation = "  "
    }
    subfields = field.slice(2)
  }

  return annotation + picaFieldIdentifier(field) + " " +
        subfields.map((s,i) => i % 2 ? s.replace(/\$/g,"$$$") : "$" + s).join("")
}

export const serializePica = (pica, options) =>
  pica.map(field => serializePicaField(field, options)).join("\n")

const picaSubfieldPattern = /\$([A-Za-z0-9])((?:[^$]+|\$\$)*)/g
const picaLinePattern = new RegExp([
  /^([^A-Za-z0-9]\s*)?([012][0-9][0-9][A-Z@])/,
  /(\/([0-9]{2,3}))?/,
  /\s*/,
  /((\$([A-Za-z0-9])([^$]|\$\$)*)+)$/,
].map(r => r.source).join(""))

export const parsePicaLine = (line, options) => {
  const match = line.match(picaLinePattern)
  if (match) {
    const tag = match[2]
    const annotated  = (options || {}).annotated
    const annotation = match[1]
    const occurrence = match[4] > 0 ? match[4] : "" // FIXME: two or three digits?
    const subfields = match[5]
    const field = [ tag, occurrence ]
    for (let m of subfields.matchAll(picaSubfieldPattern)) {
      field.push(m[1], m[2].replace(/\$\$/g, "$"))
    }
    if (annotation) {
      if (annotated === false) {
        return
      }
      field.push(annotation[0])
    } else if (annotated) {
      return
    }
    return field
  }
}

export const parsePica = (text, options) => text.split(/\n/).map(line => parsePicaLine(line, options)).filter(Boolean)

import { PicaPath } from "./picapath.js"
export { PicaPath } from "./picapath.js"

// filter record to fields listed in an array of PICA path expressions
export const filterPicaFields = (pica, exprs) => {
  exprs = Array.isArray(exprs) ? exprs : exprs.split(/\|/)
  exprs = exprs.map(e => e instanceof PicaPath ? e : new PicaPath(e))
  return pica.filter(field => exprs.some(e => e.matchField(field)))
}

// get PPN of a record
const PPN = new PicaPath("003@$0")
export const getPPN = record => PPN.getValues(record)[0]

export const picaFieldScheduleIdentifier = (schema, field) => {
  if (!schema || !field) return

  var [tag, occ] = Array.isArray(field) ? field : field.split("/")
  var counter
  if (tag && tag.charAt(0) === "2") {
    occ = null
    counter = subfieldValue(field, "x")
  }
    
  const id = picaFieldIdentifier(counter ? {tag, occurrence: occ, counter} : [tag, occ])
  const fields = schema.fields || {}

  if (id in fields) {
    return id
  } else if (occ) {
    // occurrence may be in a range
    occ = Number(occ)
    return Object.keys(fields).find(key => {
      const [t, from, to] = key.split(/[/-]/)
      return t === tag && to && Number(from) <= occ && occ <= Number(to)
    })
  } else if (counter) {
    // counter may be in a range
    counter = Number(counter)
    return Object.keys(fields).find(key => {
      const m = key.match(/^(2...)x(.+)-(.+)$/)
      return m && tag === m[1] && Number(m[2]) <= counter && counter <= Number(m[3])
    })
  }
}

export const picaFieldSchedule = (schema, field) => {
  const id = picaFieldScheduleIdentifier(schema, field)
  return id && schema.fields ? schema.fields[id] : undefined
}

// experimental: serialize
export const serializePica3Subfield = (code, value, schedule) => {
  const { pica3 } = schedule || {}
  if (pica3 === undefined) return
  if (pica3.match(/[.]{3}/)) {
    return pica3.replace("...", value)
  } else {
    return pica3 + value
  }
}

export const serializePica3Field = (field, schedule) => {
  var { pica3, subfields } = schedule
  // TODO: support occurrences and field ranges
  pica3 += " "
  for (let i=2; i<field.length; i+=2) {
    pica3 += serializePica3Subfield(field[i], field[i+1], subfields[field[i]])
  }
  return pica3
}

export const serializePica3 = (record, schema) => {
  if (!schema || !schema.fields) return
  return record.map(field => serializePica3Field(field, picaFieldSchedule(schema, field))).join("\n")
}

export const reduceRecord = (record, schema) => {
  return record.filter(field => picaFieldScheduleIdentifier(schema, field))
}

export const ppnChecksum = ppn => {
  if (ppn && ppn.match("^[0-9]+$")) {
    const length = ppn.length
    let sum = 0
    for (let i=0; i<length; i++) {
      sum += ppn[i] * (length-i+1)
    }
    sum = (11 - (sum % 11)) % 11
    return sum === 10 ? "X" : sum
  }
}

export const isDbkey = dbkey => dbkey && dbkey.match("^[a-z][a-z0-9-]*[a-z0-9]$")
export const isPPN = ppn => ppn && ppn.match("^[0-9][0-9]+X?$") && ppn.slice(-1) == ppnChecksum(ppn.slice(0,-1))
