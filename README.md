# pica-data

[![Test and build](https://github.com/gbv/pica-data-js/workflows/Test/badge.svg)](https://github.com/gbv/pica-data-js/actions?query=workflow%3A%22Test%22)
[![npm release](https://img.shields.io/npm/v/pica-data)](https://www.npmjs.com/package/pica-data)

## Table of Contents

- [Install](#install)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Install

Install the module with `npm install pica-data`.

Requires at least Node v14.8.0.

## Usage

This EcmaScript Module contains utility functions to process [PICA+ data](https://format.gbv.de/pica) (in particular [PICA Plain](http://format.gbv.de/pica/plain) and the structure of [PICA JSON](http://format.gbv.de/pica/json)).

Annotated PICA Plain is supported by default. It can be enforced or disabled on parsing and on serializing by setting option `annotated` to `true` or `false`.

* Parsing
  * function `parsePica` to parse PICA Plain syntax into a PICA record
  * function `parsePicaLine` to parse a line of PICA Plain syntax into a PICA field

* Serializing
  * function `serializePica` to serialize a PICA record in PICA Plain syntax
  * function `serializePicaField` to serialize a PICA field in PICA Plain syntax
  * function `picaFieldIdentifier` to generate a field identifier from a field or from an Avram field schedule

* Access
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

* Validation
  * function `picaFieldSchedule` to look up a field schedule for a given field in an Avram schema
  * function `picaFieldScheduleIdentifier` to look up the field identifier of a field in an Avram schema
  * function `isDbkey` to check whether a string looks like a database key
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
