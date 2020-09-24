import { readFileSync } from "fs"

export const loadJSON = file => JSON.parse(readFileSync(`./test/${file}.json`))
