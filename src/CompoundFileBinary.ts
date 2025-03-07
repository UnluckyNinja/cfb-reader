import { getFATSectorOffsetBytes, readDirectoryEntryInfo, readHeader } from './helper'

export class CompoundFileBinary {
  buffer

  /**
   * The header of the compound file.
   * @see Header
   */
  header
  isLittleEndian
  dataView
  difatArray
  directoryArray
  miniStreamArray
  minifatArray

  constructor(buffer: ArrayBuffer) {
    this.buffer = buffer
    this.dataView = new DataView(buffer)
    this.header = readHeader(buffer)
    this.isLittleEndian = this.header.endianness === 0xFFFE
    this.difatArray = [this.header.firstDiFATSectorLocation]
    this.directoryArray = [this.header.firstDirectorySectorLocation]
    this.minifatArray = [this.header.firstMiniFATSectorLocation]
    // read mini stream location from entry
    this.miniStreamArray = [readDirectoryEntryInfo(this, 0).startingSectorLocation]
  }

  /**
   * Get the offset of the DiFAT at the index.
   */
  getDiFATOffsetAt(index = 0): number {
    if (index < 0 || index >= this.header.diFATSectorCount) {
      throw new Error('DiFAT Sector index must be in range: 0 < index < diFATSectorCount')
    }
    if (index < this.difatArray.length) {
      return getFATSectorOffsetBytes(this.header, this.difatArray[index])
    }
    let cur = this.difatArray.length - 1
    let sector = this.difatArray[cur]
    let offset = getFATSectorOffsetBytes(this.header, sector)
    while (cur < index) {
      sector = this.dataView.getUint32(offset + 127 * 4, this.isLittleEndian)
      offset = getFATSectorOffsetBytes(this.header, sector)
      cur++
      this.difatArray[cur] = sector
    }
    return offset
  }

  /**
   * Get the offset of FAT Storage at the index, index between 0~108 is in header
   */
  getFATStorageOffsetAt(index = 0): number {
    const diEntryPerSector = ((1 << this.header.sectorShift) >>> 2) - 1
    if (index >= 109 + this.header.diFATSectorCount * diEntryPerSector) {
      throw new Error('FAT Storage Sector index must be in range: 0 < index < DiFAT size')
    }
    let sector = -1
    if (index < 109) {
      sector = this.header.FATSectors[index]
    }
    else {
      const target = index - 109
      const difatIndex = Math.floor(target / diEntryPerSector)
      const offset = this.getDiFATOffsetAt(difatIndex) + (target % 127) * 4
      sector = this.dataView.getUint32(offset, this.isLittleEndian)
    }
    return getFATSectorOffsetBytes(this.header, sector)
  }

  /**
   * Get the value in FAT Storage of the sector
   */
  getNextSectorIndexOf(sector = 0): number {
    const entryPerSector = (1 << this.header.sectorShift) >>> 2 // uint32
    const fatIndex = Math.floor(sector / entryPerSector)
    const fatOffset = this.getFATStorageOffsetAt(fatIndex)
    const remainder = sector - fatIndex * entryPerSector
    const offset = fatOffset + remainder * 4
    return this.dataView.getUint32(offset, this.isLittleEndian)
  }

  /**
   * Get the offset of Directory Sector
   */
  getDirectorySectorOffsetAt(index = 0): number {
    if (index < this.directoryArray.length) {
      return getFATSectorOffsetBytes(this.header, this.directoryArray[index])
    }
    let cur = this.directoryArray.length - 1
    let sector = this.directoryArray[cur]
    while (cur < index) {
      sector = this.getNextSectorIndexOf(sector)
      if (sector >= 0xFF_FF_FF_FC) {
        return sector & 0xFF_FF_FF_FF
      }
      cur++
      this.directoryArray[cur] = sector
    }
    const offset = getFATSectorOffsetBytes(this.header, sector)
    return offset
  }

  /**
   * Get the offset of a Directory Entry
   */
  getDirectoryEntryOffsetAt(index = 0): number {
    const entryPerSector = (1 << this.header.sectorShift) >>> 7 // 128 bytes per entry
    const offset = this.getDirectorySectorOffsetAt(Math.floor(index / entryPerSector))
    if (offset < 0) {
      return offset
    }
    return offset + (index % entryPerSector) * 128
  }

  /**
   * Get the offset of a mini FAT sector
   */
  getMiniFATOffsetAt(fatIndex = 0): number {
    if (fatIndex >= this.header.miniFATSectorCount) {
      throw new Error('fatIndex should be < total mini FAT sector amount.')
    }
    let minifat
    if (fatIndex < this.minifatArray.length) {
      minifat = this.minifatArray[fatIndex]
    }
    else {
      let cur = this.minifatArray.length - 1
      let last = this.minifatArray[cur]
      while (cur < fatIndex) {
        last = this.getNextSectorIndexOf(last)
        cur++
        this.minifatArray[cur] = last
      }
      minifat = last
    }
    return getFATSectorOffsetBytes(this.header, minifat)
  }

  /**
   * Get the value of a specific mini FAT entry
   */
  getNextMiniSectorIndexOf(minifatIndex = 0): number {
    const miniFATPerSector = (1 << this.header.sectorShift) >>> 2 // uint32
    const fatNumber = Math.floor(minifatIndex / miniFATPerSector)
    const remainder = minifatIndex % miniFATPerSector
    const offset = this.getMiniFATOffsetAt(fatNumber) + remainder * 4
    return this.dataView.getUint32(offset, this.isLittleEndian)
  }

  /**
   * Get offset of a mini stream sector at specified index
   */
  getMiniStreamSectorOffsetAt(index = 0): number {
    const miniFATPerSector = (1 << this.header.sectorShift) >>> 2 // uint32
    const miniStreamPerSector = (1 << this.header.sectorShift) >>> 6 // mini stream size is 64 bytes
    if (index >= Math.ceil((this.header.miniFATSectorCount * miniFATPerSector) / miniStreamPerSector)) {
      throw new Error('mini stream\'s sector index should be < total mini stream sector amount.')
    }

    let miniStreamSector
    if (index < this.miniStreamArray.length) {
      miniStreamSector = this.miniStreamArray[index]
    }
    else {
      let cur = this.miniStreamArray.length - 1
      let last = this.miniStreamArray[cur]
      while (cur < index) {
        last = this.getNextSectorIndexOf(last)
        cur++
        this.miniStreamArray[cur] = last
      }
      miniStreamSector = last
    }
    return getFATSectorOffsetBytes(this.header, miniStreamSector)
  }

  /**
   * Get the offset of a mini stream
   */
  getMiniStreamOffsetAt(index = 0): number {
    const miniStreamPerSector = (1 << this.header.sectorShift) >>> 6 // mini stream size is 64 bytes
    const sectorIndex = Math.floor(index / miniStreamPerSector)
    const remainder = index % miniStreamPerSector
    const offset = this.getMiniStreamSectorOffsetAt(sectorIndex) + remainder * 64
    return offset
  }

  /**
   * Get the buffer of a mini stream
   */
  getMiniStreamBufferOf(index = 0): ArrayBuffer {
    const offset = this.getMiniStreamOffsetAt(index)
    return this.buffer.slice(offset, offset + 64)
  }

  /**
   * Get the buffer of a normal stream
   */
  getStreamBufferOf(index = 0): ArrayBuffer {
    const offset = getFATSectorOffsetBytes(this.header, index)
    return this.buffer.slice(offset, offset + (1 << this.header.sectorShift))
  }
}
