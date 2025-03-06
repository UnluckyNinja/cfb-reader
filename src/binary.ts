import { Count, Else, IfThen, Match, PrimitiveSymbol, Relation, Size, Transform } from 'binspector'

/**
 * A header definition of Compound File Binary format.
 * @see {@link https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-cfb/05060311-bfce-4b12-874d-71fd4ce63aea|official document}
 */
export class Header {
  @Match([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1])
  @Size(8)
  @Relation(PrimitiveSymbol.u8)
  sign!: number[]

  @Size(16)
  @Relation(PrimitiveSymbol.u8)
  clsid!: number[]

  @Relation(PrimitiveSymbol.u16)
  minorVersion!: number

  @Relation(PrimitiveSymbol.u16)
  majorVersion!: number

  @Relation(PrimitiveSymbol.u16)
  endianness!: number

  @Relation(PrimitiveSymbol.u16)
  sectorShift!: number

  @Relation(PrimitiveSymbol.u16)
  miniSectorShift!: number

  @Size(6)
  @Relation(PrimitiveSymbol.u16)
  _unused0!: number[]

  @Relation(PrimitiveSymbol.u32)
  dirSectorCountV4only!: number

  @Relation(PrimitiveSymbol.u32)
  fatSectorCount!: number

  @Relation(PrimitiveSymbol.u32)
  firstDirectorySectorLocation!: number

  @Relation(PrimitiveSymbol.u32)
  transactionSignature!: number

  @Relation(PrimitiveSymbol.u32)
  miniStreamCutoffSize!: number

  @Relation(PrimitiveSymbol.u32)
  firstMiniFATSectorLocation!: number

  @Relation(PrimitiveSymbol.u32)
  miniFATSectorCount!: number

  @Relation(PrimitiveSymbol.u32)
  firstDiFATSectorLocation!: number

  @Relation(PrimitiveSymbol.u32)
  diFATSectorCount!: number

  @Size(436)
  @Relation(PrimitiveSymbol.u32)
  FATSectors!: number[]

  @Size(3584)
  @IfThen(cur => cur.majorVersion === 4, PrimitiveSymbol.u32)
  @Else()
  _unused1!: number[]
}

export class DiFATSectorV3 {
  @Count(127)
  @Relation(PrimitiveSymbol.u32)
  sectors!: number[]

  @Relation(PrimitiveSymbol.u32)
  next!: number
}

export class FATSectorV3 {
  @Count(128)
  @Relation(PrimitiveSymbol.u32)
  nextSector!: number[]
}

export class MiniFATSectorV3 {
  @Count(128)
  @Relation(PrimitiveSymbol.u32)
  nextSector!: number[]
}

export class DirectoryEntry {
  @Transform((it) => {
    return String.fromCharCode(...it.slice(0, it.indexOf(0)))
  })
  @Size(64)
  @Relation(PrimitiveSymbol.u16)
  name!: string

  // @Validate(it=>(it % 2 === 0) && it<=64)
  @Relation(PrimitiveSymbol.u16)
  nameLength!: number

  @Match([0, 1, 2, 5])
  @Relation(PrimitiveSymbol.u8)
  objectType!: number

  @Match([0, 1])
  @Relation(PrimitiveSymbol.u8)
  color!: number

  @Relation(PrimitiveSymbol.u32)
  leftSiblingID!: number

  @Relation(PrimitiveSymbol.u32)
  rightSiblingID!: number

  @Relation(PrimitiveSymbol.u32)
  childID!: number

  @Size(16)
  @Relation(PrimitiveSymbol.u8)
  CLSID!: number[]

  @Relation(PrimitiveSymbol.u32)
  stateBits!: number

  @Relation(PrimitiveSymbol.u64)
  createdTime!: bigint

  @Relation(PrimitiveSymbol.u64)
  modifiedTime!: bigint

  @Relation(PrimitiveSymbol.u32)
  startingSectorLocation!: number

  @Relation(PrimitiveSymbol.u64)
  streamSize!: bigint
}

export class DirectoryEntrySectorV3 {
  @Count(4)
  @Relation(DirectoryEntry)
  entries!: DirectoryEntry[]
}
