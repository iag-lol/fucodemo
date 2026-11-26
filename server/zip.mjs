// ZIP sin compresión (las fotos ya vienen comprimidas), enviado en streaming.
import { readFile } from 'node:fs/promises';
import { crc32 } from 'node:zlib';
import { once } from 'node:events';

export async function sendZip(res, files) {
  const central = [];
  const used = new Set();
  let offset = 0;
  const write = async (buf) => { offset += buf.length; if (!res.write(buf)) await once(res, 'drain'); };
  const d = new Date();
  const time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();

  for (const file of files) {
    let name = file.name;
    for (let n = 2; used.has(name.toLowerCase()); n++) name = file.name.replace(/(\.[^.]+)?$/, ` (${n})$1`);
    used.add(name.toLowerCase());
    const data = await readFile(file.path);
    const nameBuf = Buffer.from(name, 'utf8');
    const crc = crc32(data);
    const at = offset;
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(time, 10); local.writeUInt16LE(date, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26);
    await write(local); await write(nameBuf); await write(data);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(time, 12); entry.writeUInt16LE(date, 14); entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(data.length, 20); entry.writeUInt32LE(data.length, 24); entry.writeUInt16LE(nameBuf.length, 28);
    entry.writeUInt32LE(at, 42);
    central.push(entry, nameBuf);
  }
  const start = offset;
  for (const buf of central) await write(buf);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(offset - start, 12); end.writeUInt32LE(start, 16);
  res.end(end);
}
