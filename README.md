# cfb-reader

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

Read content of compound file binary format

## Binary definition
Compound file binary format [Official document](https://learn.microsoft.com/zh-cn/openspecs/windows_protocols/ms-cfb/c5d235f7-b73c-4ec5-bf8d-5c08306cd023)

| Sectors | Header | DiFAT | FAT Storage | Directory | MiniFAT | Mini Stream | Normal Stream |
| ---       | ---    | ---   | ---         | ---       | ---     | ---         | ---           |
| Content   | Basic info of various Structure | A list of all FAT Storage in the file | The next sector position at the specified index (except DiFAT and FAT Storage itself)| The directory structure that the file packed | The next position at the specified index (in the context of mini stream strucutre) | Mini stream blobs (<4096B) | Regular blobs (>4096B) |
| Starting Location | 0 | Specified in header | DiFAT[0] | Specified in header | Specified in header | Specified by the root entry of directory entries (at index 0) | Specified in each entry |
| Amount | 1 sector | Specified in Header | Specified in header (not sure) | Not specified (v4: in header) | Specified in Header | Specified by the root entry of directory entries | Not specified |
| Sub-structure | N/A | FAT Storage's index in FAT | Next position in FAT chain of a sector | An entry specified various properties of the object | Next position in mini stream chain of a mini sector | Part of a mini object | Part of a regular object |
| Sub-strucutre Type | N/A | uint32 | uint32 | Directory Entry | uint32 | buffer | buffer |
| Sub-structure Size | N/A | 4 bytes | 4 bytes | 128 bytes | 4 bytes | 64 bytes | Sector size |

## Note on package patches
- `unbuild` is patched to forcely bundle dependencies for browser
- `binspector` is patched to resolve the error casued by incorrect 'module' in its `package.json`

## License

[MIT](./LICENSE) License

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/cfb-reader?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/cfb-reader
[npm-downloads-src]: https://img.shields.io/npm/dm/cfb-reader?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/cfb-reader
[bundle-src]: https://img.shields.io/bundlephobia/minzip/cfb-reader?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=cfb-reader
[license-src]: https://img.shields.io/github/license/UnluckyNinja/cfb-reader.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/UnluckyNinja/cfb-reader/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/cfb-reader
