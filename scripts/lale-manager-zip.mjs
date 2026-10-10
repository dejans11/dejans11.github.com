import { inflateRawSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => {
  for (let bit = 0; bit < 8; bit++) n = (n >>> 1) ^ (n & 1 ? 0xedb88320 : 0);
  return n >>> 0;
});
function crc32(data) {
  let crc = 0xffffffff;
  for (const byte of data) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
  return (crc ^ 0xffffffff) >>> 0;
}

/** Validate the three-file offline build before replacing a downloadable release. */
export function assertOfflineArchive(zip, html) {
  const invalid = () => { throw new Error('Invalid built ZIP archive or offline HTML does not match the build.'); };
  try {
    let end = zip.length - 22;
    for (; end >= Math.max(0, zip.length - 65557); end--) {
      if (zip.readUInt32LE(end) === 0x06054b50 && end + 22 + zip.readUInt16LE(end + 20) === zip.length) break;
    }
    if (end < 0 || zip.readUInt16LE(end + 4) || zip.readUInt16LE(end + 6) || zip.readUInt16LE(end + 8) !== 3 || zip.readUInt16LE(end + 10) !== 3) invalid();
    const start = zip.readUInt32LE(end + 16), length = zip.readUInt32LE(end + 12);
    if (start + length !== end) invalid();
    const names = new Set(['index.html', 'README.md', 'reference-notes.md']);
    let cursor = start, offlineHtml;
    for (let entry = 0; entry < 3; entry++) {
      if (cursor + 46 > end || zip.readUInt32LE(cursor) !== 0x02014b50) invalid();
      const flags = zip.readUInt16LE(cursor + 8), method = zip.readUInt16LE(cursor + 10);
      const crc = zip.readUInt32LE(cursor + 16), packed = zip.readUInt32LE(cursor + 20), size = zip.readUInt32LE(cursor + 24);
      const nameSize = zip.readUInt16LE(cursor + 28), local = zip.readUInt32LE(cursor + 42);
      const next = cursor + 46 + nameSize + zip.readUInt16LE(cursor + 30) + zip.readUInt16LE(cursor + 32);
      if (next > end || flags & ~0x800 || ![0, 8].includes(method) || size > 32 * 1024 * 1024 || zip.readUInt16LE(cursor + 34)) invalid();
      const name = zip.subarray(cursor + 46, cursor + 46 + nameSize);
      if (!names.delete(name.toString('utf8')) || local + 30 > start || zip.readUInt32LE(local) !== 0x04034b50) invalid();
      const dataStart = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
      if (dataStart + packed > start || zip.readUInt16LE(local + 6) !== flags || zip.readUInt16LE(local + 8) !== method || zip.readUInt32LE(local + 14) !== crc || zip.readUInt32LE(local + 18) !== packed || zip.readUInt32LE(local + 22) !== size || !zip.subarray(local + 30, local + 30 + zip.readUInt16LE(local + 26)).equals(name)) invalid();
      const compressed = zip.subarray(dataStart, dataStart + packed);
      const data = method === 8 ? inflateRawSync(compressed, { maxOutputLength: 32 * 1024 * 1024 }) : compressed;
      if (data.length !== size || crc32(data) !== crc) invalid();
      if (name.toString('utf8') === 'index.html') {
        if (html !== undefined && !data.equals(html)) invalid();
        offlineHtml = data;
      }
      cursor = next;
    }
    if (cursor !== end || names.size) invalid();
    return offlineHtml;
  } catch { invalid(); }
}
