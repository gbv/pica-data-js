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

  tagString() {
    return this.tag.source.substring(1, this.tag.source.length-1)
  }

  fieldIdentifier() {
    return this.tagString() + (this.occ ? "/" + this.occurrenceString() : "")
  }

  startOccurrence() {
    return Array.isArray(this.occ) ? this.occ[0] : null
  }

  endOccurrence() {
    return Array.isArray(this.occ) ? this.occ[1] : null
  }

  occurrenceString() {
    if (Array.isArray(this.occ)) return this.occ.join("-")
    return this.occf ? this.occ.source.substr(1,this.occ.source.length-1) : ""
  }

  subfieldString() {
    const source = this.sf ? this.sf.source : ""
    return source.substring(2,source.length-2)
  }

  toString() {
    return this.fieldIdentifier()
            + (this.sf ? "$" + this.subfieldString() : "")
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
