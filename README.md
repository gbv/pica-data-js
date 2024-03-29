# pica-data

[![Test and build](https://github.com/gbv/pica-data-js/workflows/Test/badge.svg)](https://github.com/gbv/pica-data-js/actions?query=workflow%3A%22Test%22)
[![npm release](https://img.shields.io/npm/v/pica-data)](https://www.npmjs.com/package/pica-data)

PICA+ record processing

## Table of Contents

- [Install](#install)
- [Usage](#usage)
  - [Parsing](#parsing)
  - [Serializing](#serializing)
  - [Access](#access)
  - [Validation](#validation)
- [Contributing](#contributing)
- [License](#license)

## Install

`npm install pica-data` (requires Node >= v16)

## Usage

This EcmaScript Module contains utility functions to process [PICA+ data](https://format.gbv.de/pica).

The following serialization formats are supported:

- [PICA Plain](http://format.gbv.de/pica/plain) parsing and serialization (`plain`)
- [Annotated PICA](http://format.gbv.de/pica/plain) parsing and serialization (`annotated`)
- PICA Patch Plain (annotated PICA with annotation `+`, `-`, ` ` parsing (`patch-plain`)
- [Normalized PICA](http://format.gbv.de/pica/normalized) parsing (`normalized`)
- PICA Patch Normalized parsing (`patch-normalized`)
- [PICA JSON](http://format.gbv.de/pica/json)

### Parsing

Parsing from string is supported by exported function `parsePica`. The serialization format is passed as second argument or as option. The function always returns an array of records. Parsing errors result in skipped records unless option `error` is enabled. 

~~~js
import { parsePica } from "pica-data"

const records = parsePica(input, { format: "plain" })
~~~

Parsing from readable streams is supported by parser functions `parseStream` (returns a stream of records) and `parseAll` (returns a promise resolving in an array of records).

~~~js
import { parseStream, parseAll } from "pica-data"

// transform stream
parseStream(process.stdin, { format: "plain" })
  .on("data", record => console.log(record))
  .on("error", ({message, line}) => console.error(`${message} on line ${line}`))

// promise stream to array
parseAll(process.stdin, { format: "plain"})
  .then(records => console.log(records))
  .catch(e => console.error(`${e.message} on line ${e.line}`))
~~~

In addition the function `parsePicaLine` can be used to parse a single line of PICA Plain (optionally annotated) into a PICA field.

To process PICA/XML as returned via SRU use [xml2js](https://www.npmjs.com/package/xml2js) and transform records with exported function `fromXML`:

~~~js
import { fromXML, serializePica } from 'pica-data'
import createClient from '@natlibfi/sru-client'

createClient({
  url:'https://sru.k10plus.de/opac-de-627', version: '1.1',
  recordSchema: 'picaxml', recordFormat: 'object'
}).searchRetrieve('pica.tit=Beowulf')
  .on('record', record => {
     const pica = fromXML(record)
     console.log(serializePica(pica))
  })
~~~

### Serializing

* function `serializePica` to serialize a PICA record in PICA Plain syntax (optionally annotated)
* function `serializePicaField` to serialize a PICA field in PICA Plain syntax (optionally annotated)
* function `picaFieldIdentifier` to generate a field identifier from a field or from an Avram field schedule

### Access

* function `getPPN` to extract the PPN of a record
* class `PicaPath` to work with PICA Path expressions
  * method `fieldIdentifier` to get the path's field identifier (tag and optional occurrence)
  * method `tagString` to get the path's PICA tag, without occurrence
  * method `occurrenceString` to get the path's occurrence (or an empty string)
  * method `startOccurrence` to get the path's start occurrence (or an empty string)
  * method `endOccurrence` to get the path's end occurrence (or an empty string)
  * method `subfieldString` to get the path's subfield identifier (or an empty string)
  * method `toString` to get field identifier and subfield identifier combined
  * method `matchField(field)` to check whether a PICA field matches the path
  * method `getFields(record)` to filter all matching PICA fields 
  * method `extractSubfields(field)` to filter out all matching subfield values
  * method `getValues(record)` to get a (possibly empty) array of matching subfield values
  * method `getUniqueValues(record)` same as `getValues` but unique values only

### Validation

* function `picaFieldSchedule` to look up a field schedule for a given field in an Avram schema
* function `picaFieldScheduleIdentifier` to look up the field identifier of a field in an Avram schema
* function `isPPN` to check whether a string looks like a valid PPN (including checksum)
* function `ppnChecksum` to calculate the checksum of a PPN

## Contributing

PRs accepted against the `dev` branch. Never directly work on the main branch.

For releases (maintainers only) make changes on `dev` and then run the release script:

```bash
npm run release:patch # or minor or major
```

## License

[MIT License](LICENSE) Verbundzentrale des GBV (VZG)
