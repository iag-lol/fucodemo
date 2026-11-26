// Genera las versiones web (WebP responsive, miniaturas, iconos) en public/media.
import sharp from 'sharp';
import { existsSync, linkSync, copyFileSync, mkdirSync, readdirSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { photos, logos } from './media-map.mjs';
import { brands } from '../src/data/brands.mjs';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'media-originals');
const OUT = join(ROOT, 'public/media');
for (const d of ['img', 'video', 'brand']) mkdirSync(join(OUT, d), { recursive: true });

const WIDTHS = [480, 960, 1600, 2400];
const manifest = {};
for (const d of ['stills', 'video-extra']) mkdirSync(join(SRC, d), { recursive: true });

const entries = Object.entries(photos).map(([n, f]) => [n, join(SRC, 'img', f)]);
for (const f of readdirSync(join(SRC, 'stills')).filter((f) => f.endsWith('.jpg')).sort()) {
  entries.push([basename(f, '.jpg'), join(SRC, 'stills', f)]);
}

async function processPhoto([name, file]) {
  const base = sharp(file).rotate().flatten({ background: '#000' });
  const { width, height } = await sharp(file).metadata();
  const widths = WIDTHS.filter((x) => x < width);
  if (width <= 2400) widths.push(width); else if (!widths.includes(2400)) widths.push(2400);
  for (const x of widths) {
    const dest = join(OUT, 'img', `${name}-${x}.webp`);
    if (!existsSync(dest)) await base.clone().resize({ width: x }).webp({ quality: x > 1600 ? 76 : 80, effort: 4 }).toFile(dest);
  }
  const tiny = await base.clone().resize({ width: 20 }).webp({ quality: 40 }).toBuffer();
  const { dominant } = await sharp(await base.clone().resize({ width: 120 }).toBuffer()).stats();
  const hex = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  manifest[name] = { w: width, h: height, widths, color: hex, lqip: `data:image/webp;base64,${tiny.toString('base64')}` };
}

const queue = [...entries];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await processPhoto(queue.shift()); }));
const ordered = Object.fromEntries(entries.map(([n]) => [n, manifest[n]]));

// Logos (con transparencia)
for (const [name, f] of Object.entries(logos)) {
  const buf = await sharp(join(SRC, 'img', f)).trim().resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  writeFileSync(join(OUT, 'brand', `${name}.png`), buf);
  const m = await sharp(buf).metadata();
  ordered[name] = { w: m.width, h: m.height, logo: true };
}

// Logos de clientes: todos en blanco, recortados al contenido
mkdirSync(join(OUT, 'brand/logos'), { recursive: true });
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const MASKS = {
  alpha: () => 1,
  dark: (r, g, b) => clamp01((1 - (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255) * 1.7 - 0.08),
  bright: (r, g, b) => clamp01(((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 - 0.5) * 3.2),
  blue: (r, g, b) => clamp01(((b - r) / 255 - 0.12) * 1.6),
  solid: (r, g, b) => clamp01(((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 - 0.2) * 4),
  white: (r, g, b) => clamp01(((0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 - 0.74) * 5),
};
const brandInfo = {};
for (const brand of brands) {
  const file = join(SRC, brand.file);
  let input = sharp(file, { density: 600 }).ensureAlpha();
  if (brand.crop) {
    const full = await input.png().toBuffer();
    const m = await sharp(full).metadata();
    input = sharp(full).extract({ left: 0, top: 0, width: Math.round(m.width * brand.crop), height: m.height });
  }
  const sized = await input.png().toBuffer();
  const { data, info } = await sharp(sized).resize({ width: 640, height: 320, fit: 'inside', withoutEnlargement: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = MASKS[brand.mask ?? 'alpha'];
  for (let i = 0; i < data.length; i += 4) {
    const a = Math.round(data[i + 3] * mask(data[i], data[i + 1], data[i + 2]));
    data[i] = data[i + 1] = data[i + 2] = 255;
    data[i + 3] = a < 6 ? 0 : a;
  }
  const white = await sharp(data, { raw: info }).png().toBuffer();
  const out = await sharp(white).trim({ threshold: 1 }).png().toBuffer();
  const m = await sharp(out).metadata();
  writeFileSync(join(OUT, 'brand/logos', `${brand.id}.png`), out);
  brandInfo[brand.id] = { w: m.width, h: m.height };
}

// Fotogramas para la línea de tiempo
mkdirSync(join(OUT, 'timeline'), { recursive: true });
mkdirSync(join(SRC, 'timeline'), { recursive: true });
for (const f of readdirSync(join(SRC, 'timeline')).filter((f) => f.endsWith('.jpg'))) {
  await sharp(join(SRC, 'timeline', f)).resize(256, 144, { fit: 'cover' }).webp({ quality: 74 }).toFile(join(OUT, 'timeline', f.replace(/jpg$/, 'webp')));
}

// Iconos de la marca
const mark = join(OUT, 'brand/logo-fuco.png');
for (const [size, file] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [192, 'icon-192.png'], [512, 'icon-512.png']]) {
  const inner = await sharp(mark).resize({ width: Math.round(size * 0.66), height: Math.round(size * 0.66), fit: 'inside' }).toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#0a0a0b' } })
    .composite([{ input: inner, gravity: 'centre' }]).png().toFile(join(OUT, 'brand', file));
}

// Imagen para compartir en redes
const bg = await sharp(join(SRC, 'img', photos['terrex-02'])).resize(1200, 630, { fit: 'cover' }).modulate({ brightness: 0.5 }).toBuffer();
const ogLogo = await sharp(mark).resize({ height: 260 }).toBuffer();
await sharp(bg).composite([
  { input: ogLogo, gravity: 'centre' },
  { input: Buffer.from('<svg width="1200" height="630"><text x="600" y="560" text-anchor="middle" fill="#fff" font-family="Helvetica" font-size="34" letter-spacing="14">FUCO ESTUDIO · FOTOGRAFÍA Y VIDEO</text></svg>') },
]).jpeg({ quality: 84 }).toFile(join(OUT, 'brand/og.jpg'));

// Videos (enlace duro para no duplicar espacio)
function place(from, to) {
  if (existsSync(to)) rmSync(to);
  try { linkSync(from, to); } catch { copyFileSync(from, to); }
}
const videos = {};
const addVideo = (id, q, file) => { (videos[id] ??= {})[q] = Math.round(statSync(file).size / 1024 / 102.4) / 10; };
for (const f of readdirSync(join(SRC, 'video'))) {
  const m = f.match(/^(.+)-(360p|720p|1080p)\.mp4$/);
  if (!m) continue;
  place(join(SRC, 'video', f), join(OUT, 'video', f));
  addVideo(m[1], m[2], join(SRC, 'video', f));
}
// Videos agregados a mano: media-originals/video-extra/<slug-del-proyecto>.mp4
for (const f of readdirSync(join(SRC, 'video-extra')).filter((f) => f.toLowerCase().endsWith('.mp4'))) {
  const id = f.slice(0, -4);
  place(join(SRC, 'video-extra', f), join(OUT, 'video', `${id}-720p.mp4`));
  addVideo(id, '720p', join(SRC, 'video-extra', f));
}

mkdirSync(join(ROOT, 'src/data'), { recursive: true });
writeFileSync(join(ROOT, 'src/data/media.json'), JSON.stringify({ images: ordered, videos, brands: brandInfo }));
console.log(`${entries.length} fotos, ${Object.keys(videos).length} videos procesados`);
