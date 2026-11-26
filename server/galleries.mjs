// Galerías privadas de clientes: códigos, fotos y miniaturas.
import { randomBytes, randomInt } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import sharp from 'sharp';
import { db, save, DATA } from './store.mjs';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => { const c = Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join(''); return `${c.slice(0, 4)}-${c.slice(4)}`; };
const dirOf = (g) => join(DATA, 'galleries', g.code);

export function find(code, { includeExpired = false } = {}) {
  const g = db.galleries.find((x) => x.code === String(code ?? '').trim().toUpperCase());
  if (!g) return null;
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });
  return includeExpired || !g.expires || g.expires >= today ? g : null;
}

export function create({ title, client, expires, code }) {
  const g = { code: code ?? newCode(), title, client, expires: expires || '', createdAt: new Date().toISOString(), photos: [], favorites: [], comment: '' };
  db.galleries.unshift(g);
  save();
  return g;
}

export async function addPhoto(g, buffer, filename) {
  const meta = await sharp(buffer).metadata();
  const ext = { jpeg: 'jpg', png: 'png', webp: 'webp' }[meta.format];
  if (!ext) throw Object.assign(new Error('Formato no admitido (usa JPG, PNG o WebP)'), { status: 415 });
  const id = randomBytes(8).toString('hex');
  const dir = dirOf(g);
  await mkdir(dir, { recursive: true });
  const base = sharp(buffer).rotate();
  await base.clone().resize({ width: 640, height: 900, fit: 'inside', withoutEnlargement: true }).webp({ quality: 74 }).toFile(join(dir, `${id}-thumb.webp`));
  await base.clone().resize({ width: 2200, height: 2200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(dir, `${id}-large.webp`));
  await writeFile(join(dir, `${id}.${ext}`), buffer);
  const clean = basename(String(filename || 'foto')).replace(/[^\p{L}\p{N} ._()-]/gu, '_').replace(/\.[^.]*$/, '').slice(0, 80) || 'foto';
  const turned = (meta.orientation ?? 1) >= 5;
  const photo = { id, ext, name: `${clean}.${ext}`, w: turned ? meta.height : meta.width, h: turned ? meta.width : meta.height };
  g.photos.push(photo);
  save();
  return photo;
}

export function photoFile(g, id, size) {
  const p = g.photos.find((x) => x.id === id);
  if (!p) return null;
  const file = size === 'original' ? `${p.id}.${p.ext}` : `${p.id}-${size === 'thumb' ? 'thumb' : 'large'}.webp`;
  return { photo: p, path: join(dirOf(g), file) };
}

export async function removePhoto(g, id) {
  const p = g.photos.find((x) => x.id === id);
  if (!p) return false;
  g.photos = g.photos.filter((x) => x !== p);
  g.favorites = g.favorites.filter((x) => x !== id);
  save();
  await Promise.all([`${p.id}.${p.ext}`, `${p.id}-thumb.webp`, `${p.id}-large.webp`].map((f) => rm(join(dirOf(g), f), { force: true })));
  return true;
}

export async function remove(g) {
  db.galleries = db.galleries.filter((x) => x !== g);
  save();
  await rm(dirOf(g), { recursive: true, force: true });
}

/** Galería de demostración (solo fuera de producción y una única vez). */
export async function seedDemo() {
  if (db.demoSeeded || process.env.NODE_ENV === 'production') return;
  const names = ['ffl-01', 'ffl-02', 'ffl-03', 'ffl-04', 'ffl-05', 'ffl-06', 'ffl-07', 'ffl-08'];
  const files = names.map((n) => new URL(`../public/media/img/${n}-1600.webp`, import.meta.url).pathname).filter(existsSync);
  if (!files.length) return;
  const g = create({ title: 'Galería de demostración', client: 'FUCO Estudio', code: 'DEMO-FUCO' });
  for (const [i, f] of files.entries()) await addPhoto(g, await readFile(f), `FUCO-demo-${String(i + 1).padStart(2, '0')}.webp`);
  db.demoSeeded = true;
  save();
}
