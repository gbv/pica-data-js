# pica-data

[![Test and build](https://github.com/gbv/pica-data-js/workflows/Test%20and%20build/badge.svg)](https://github.com/gbv/pica-data-js/actions?query=workflow%3A%22Test+and+build%22)
[![npm release](https://img.shields.io/npm/v/pica-data-js)](https://www.npmjs.com/package/pica-data-js)

## Description

This EcmaScript Module contains utility functions to process [PICA+] data:

[PICA+]: https://format.gbv.de/pica/plus

* Parsing
  * function `parsePica` to parse PICA Plain syntax into a PICA record
  * function `parsePicaLine` to parse a line of PICA Plain syntax into a PICA field

* Serializing
  * function `serializePica` to serialize a PICA record in PICA Plain syntax
  * function `serializePicaFIeld` to serialize a PICA field in PICA Plain syntax
  * function `picaFieldIdentifier` to generate a field identifier from a field

* Access
  * class `PicaPath` to work with PICA Path expressions
  * function `getPPN` to extract the PPN of a record

* Validation
  * function `picaFieldSchedule` to look up a field schedule for a given field in an Avram schema

## LICENSE

[MIT License](LICENSE)
