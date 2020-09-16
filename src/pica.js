/**
 * PICA data processing module.
 */

// parsing and serializing PICA+ <-> PICA/JSON

export const picaFieldIdentifier = field => {
  const [ tag, occ ] = Array.isArray(field) ? field : [field.tag, field.occurrence]
        
  if ("counter" in field) {
    return tag + "x" + field.counter
  } else {
    return tag + (occ ? "/" + (occ.length === 1 ? "0" + occ : occ) : "")
  }
}

export const serializePicaField = field =>
  picaFieldIdentifier(field)
    + " "
    + field.slice(2).map((s,i) => i % 2 ? s.replace(/\$/g,"$$$") : "$" + s).join("")

export const serializePica = pica =>
  pica.map(serializePicaField).join("\n")

const picaSubfieldPattern = /\$([A-Za-z0-9])((?:[^$]+|\$\$)+)/g
const picaLinePattern = new RegExp([
  /^([012][0-9][0-9][A-Z@])/,
  /(\/([0-9]{2,3}))?/,
  /\s*/,
  /((\$([A-Za-z0-9])([^$]|\$\$)+)+)$/,
].map(r => r.source).join(""))

export const parsePicaLine = line => {
  const match = line.match(picaLinePattern)
  if (match) {
    const tag = match[1]
    const occurrence = match[3]
    const subfields = match[4]
    const field = [ tag, occurrence ]
    for (let m of subfields.matchAll(picaSubfieldPattern)) {
      field.push(m[1], m[2].replace(/\$\$/g, "$"))
    }
    return field
  }
}

export const parsePica = text => text.split(/\n/).map(parsePicaLine).filter(Boolean)

// PICA path expression
export class PicaPath {
  constructor(s) {
    const match = s.match(
      /^([012.][0-9.][0-9.][A-Z@.])(\[(([0-9.]{2})|([0-9]{2}-[0-9]{2}))\])?(\$([_A-Za-z0-9]+))?$/)
    if (!match) throw "Invalid PICA Path expression"

    this.tag = new RegExp("^"+match[1]+"$")
    this.occ = match[4]
      ? new RegExp("^"+match[4]+"$")
      : (match[5] ? match[5].split("-") : null)
    this.sf  = match[7] ? new RegExp("^["+match[7]+"]$") : null
  }

  get tagString() {
    return this.tag.source.substring(1, this.tag.source.length-1)
  }

  get fieldIdentifier() {
    return this.tagString + (this.occ ? "/" + this.occurrenceString : "")
  }

  get startOccurrence() {
    return Array.isArray(this.occ) ? this.occ[0] : null
  }

  get endOccurrence() {
    return Array.isArray(this.occ) ? this.occ[1] : null
  }

  get occurrenceString() {
    if (Array.isArray(this.occ)) return this.occ.join("-")
    return this.occf ? this.occ.source.substr(1,this.occ.source.length-1) : ""
  }

  get subfieldString() {
    const source = this.sf ? this.sf.source : ""
    return source.substring(2,source.length-2)
  }

  get toString() {
    return this.fieldIdentifier
            + (this.sf ? "$" + this.subfieldString : "")
  }

  matchField(field) {
    const [tag, occ] = field
    if (!this.tag.test(tag)) { return false }
    if (tag[0] === "2" || (!occ && !this.occ)) { return true }
    if (this.occ && !occ) return true
    return Array.isArray(this.occ)
      ? this.occ[0] <= occ && this.occ[1] >= occ
      : this.occ.test(occ)
  }

  extractSubfields(field) {
    return field.filter((_,i) => i>2 && i%2 && (!this.sf || this.sf.test(field[i-1])))
  }

  getFields(record) {
    return record.filter(f => this.matchField(f))
  }

  getValues(record) {
    return [].concat(...(this.getFields(record).map(f => this.extractSubfields(f))))
  }

  getUniqueValues(record) {
    return [...new Set(this.getValues(record))]
  }
}

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
  if (tag && tag.charAt(0) === "2") occ = null
    
  const id = picaFieldIdentifier([tag, occ])
  const fields = schema.fields || {}

  if (id in fields) {
    return id
  } else if (occ) {
    // occurrence may be in a range
    occ = Number(occ)
    return Object.keys(fields).find(key => {
      const [t, from, to] = key.split(/[/-]/)
      return t === tag && to && occ <= Number(to) && occ >= Number(from)
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
