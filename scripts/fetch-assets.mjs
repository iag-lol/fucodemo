// Descarga el material original desde el sitio actual (Wix) a media-originals/.
// Es idempotente: omite lo que ya existe.
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

const { images, videos } = JSON.parse(readFileSync(new URL('./sources.json', import.meta.url)));
const root = new URL('../media-originals/', import.meta.url).pathname;
mkdirSync(root + 'img', { recursive: true });
mkdirSync(root + 'video', { recursive: true });

async function download(url, dest) {
  if (existsSync(dest)) return 'ya existe';
  const res = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (!res.ok) return `error HTTP ${res.status}`;
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest + '.part'));
  renameSync(dest + '.part', dest);
  return 'ok';
}

const jobs = [
  ...images.map((f) => [`https://static.wixstatic.com/media/${f}`, `${root}img/${f}`]),
  ...Object.entries(videos).flatMap(([name, id]) =>
    ['360p', '720p', '1080p'].map((q) => [`https://video.wixstatic.com/video/${id}/${q}/mp4/file.mp4`, `${root}video/${name}-${q}.mp4`])),
];

let failed = 0;
const queue = [...jobs];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const [url, dest] = queue.shift();
    const r = await download(url, dest).catch((e) => `error ${e.message}`);
    if (r.startsWith('error')) { failed++; console.log(r, url); }
  }
}));
console.log(`${jobs.length - failed}/${jobs.length} archivos listos`);
