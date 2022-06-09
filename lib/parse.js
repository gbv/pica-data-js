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
