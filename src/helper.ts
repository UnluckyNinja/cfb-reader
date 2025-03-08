import type { CompoundFileBinary } from './CompoundFileBinary'
import { BinaryCursorEndianness, BinaryReader, binread } from 'binspector'
import { DirectoryEntry, DirectoryEntrySectorV3, Header } from './binary'

export function readHeader(buffer: ArrayBuffer): Header {
  const header = binread(new BinaryReader(buffer.slice(0, 512), BinaryCursorEndianness.LittleEndian), Header)
  return header
}

export function getFATSectorOffsetBytes(header: Header, num: number): number {
  if (!header.sectorShift)
    throw new Error('getFATSectorOffsetBytes parameters might be wrong')
  return (num + 1) * (1 << header.sectorShift)
}

export function readDirectorySectorInfoV3(cfbfile: CompoundFileBinary, index: number): DirectoryEntrySectorV3 {
  const offset = cfbfile.getDirectorySectorOffsetAt(index)
  const buffer = cfbfile.buffer.slice(offset, offset + 512)
  const entry = binread(new BinaryReader(buffer, BinaryCursorEndianness.LittleEndian), DirectoryEntrySectorV3)
  return entry
}

export function readDirectoryEntryInfo(cfbfile: CompoundFileBinary, index: number): DirectoryEntry {
  const offset = cfbfile.getDirectoryEntryOffsetAt(index)
  const buffer = cfbfile.buffer.slice(offset, offset + 128)
  const entry = binread(new BinaryReader(buffer, BinaryCursorEndianness.LittleEndian), DirectoryEntry)
  return entry
}

export function readStreamObjectContent(cfbfile: CompoundFileBinary, index: number, size: number, buffer?: Uint8Array): Uint8Array {
  const u8arr = buffer ?? new Uint8Array(size)
  if (size < cfbfile.header.miniStreamCutoffSize) {
    // mini stream
    let idx = index
    const MINI_SIZE = 1 << cfbfile.header.miniSectorShift
    const total = Math.ceil(size / MINI_SIZE)
    for (let i = 0; i < total - 1; i++) {
      const buf = cfbfile.getMiniStreamBufferOf(idx)
      u8arr.set(new Uint8Array(buf), i * MINI_SIZE)
      idx = cfbfile.getNextMiniSectorIndexOf(idx)
    }
    const left = size % MINI_SIZE
    if (left !== 0) {
      const buf = cfbfile.getMiniStreamBufferOf(idx)
      u8arr.set(new Uint8Array(buf, 0, left), (total - 1) * MINI_SIZE)
    }
    return u8arr
  }
  else {
    // normal stream
    let idx = index
    const SECTOR_SIZE = 1 << cfbfile.header.sectorShift
    const total = Math.ceil(size / SECTOR_SIZE)
    for (let i = 0; i < total - 1; i++) {
      const buf = cfbfile.getStreamBufferOf(idx)
      u8arr.set(new Uint8Array(buf), i * SECTOR_SIZE)
      idx = cfbfile.getNextSectorIndexOf(idx)
    }
    const left = size % SECTOR_SIZE
    if (left !== 0) {
      const buf = cfbfile.getStreamBufferOf(idx)
      u8arr.set(new Uint8Array(buf, 0, left), (total - 1) * SECTOR_SIZE)
    }
    return u8arr
  }
}
