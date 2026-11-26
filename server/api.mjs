// API: solicitudes, disponibilidad, tarifas, galerías y panel interno.
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import { db, save, DATA } from './store.mjs';
import * as galleries from './galleries.mjs';
import { sendZip } from './zip.mjs';
import { notify } from './mail.mjs';
import { services, quoteOptions } from '../src/data/content.mjs';

/* Contraseña del panel: variable ADMIN_PASSWORD o una generada en el primer arranque */
const adminFile = join(DATA, 'admin.json');
const derive = (password, salt) => scryptSync(password, salt, 32);
function loadAdmin() {
  if (process.env.ADMIN_PASSWORD) {
    const salt = randomBytes(16).toString('hex');
    return { salt, hash: derive(process.env.ADMIN_PASSWORD, salt).toString('hex') };
  }
  if (existsSync(adminFile)) return JSON.parse(readFileSync(adminFile, 'utf8'));
  const password = randomBytes(12).toString('base64url');
  const salt = randomBytes(16).toString('hex');
  const record = { salt, hash: derive(password, salt).toString('hex') };
  writeFileSync(adminFile, JSON.stringify(record), { mode: 0o600 });
  writeFileSync(join(DATA, 'CLAVE-PANEL.txt'), `${password}\n`, { mode: 0o600 });
  console.log(`Se creó la contraseña del panel en ${join(DATA, 'CLAVE-PANEL.txt')}`);
  return record;
}
const admin = loadAdmin();
const sessions = new Map();
const SESSION_MS = 12 * 60 * 60 * 1000;

/* Utilidades */
const fail = (status, message) => Object.assign(new Error(message), { status });
export function json(res, status, body, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(body));
}
const ipOf = (req) => (process.env.TRUST_PROXY && req.headers['x-forwarded-for']?.split(',').at(-1).trim()) || req.socket.remoteAddress;
const hits = new Map();
function limit(req, bucket, max, minutes = 10) {
  const key = `${bucket}:${ipOf(req)}`;
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < minutes * 60_000);
  if (list.length >= max) throw fail(429, 'Demasiados intentos. Espera unos minutos.');
  list.push(now);
  hits.set(key, list);
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now - v.at(-1) > 3_600_000) hits.delete(k); }, 600_000).unref();

async function readBody(req, max) {
  if (Number(req.headers['content-length']) > max) throw fail(413, 'El archivo es demasiado grande');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > max) throw fail(413, 'El archivo es demasiado grande');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function readJson(req) {
  const raw = await readBody(req, 64 * 1024);
  try { const v = JSON.parse(raw.toString('utf8')); if (v && typeof v === 'object') return v; } catch { /* cae al error */ }
  throw fail(400, 'Datos inválidos');
}
const text = (v, max = 200) => (typeof v === 'string' ? v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '');
const isDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Santiago' });
const newRef = () => `FUCO-${today().slice(2, 7).replace('-', '')}-${randomBytes(3).toString('hex').toUpperCase()}`;

function addLead(lead) {
  const record = { id: randomBytes(8).toString('hex'), ref: newRef(), status: 'nuevo', createdAt: new Date().toISOString(), ...lead };
  db.leads.unshift(record);
  save();
  notify(record);
  return record;
}

function session(req) {
  const token = /(?:^|;\s*)fuco_admin=([a-f0-9]{64})/.exec(req.headers.cookie ?? '')?.[1];
  const expires = token && sessions.get(token);
  return expires > Date.now() ? token : null;
}
const cookie = (req, value, maxAge) => `fuco_admin=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : ''}`;

function csv() {
  const cell = (v) => { let s = String(v ?? ''); if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; return `"${s.replaceAll('"', '""')}"`; };
  const head = ['Fecha', 'Referencia', 'Tipo', 'Estado', 'Nombre', 'Email', 'Teléfono', 'Empresa', 'Mensaje', 'Detalle'];
  const rows = db.leads.map((l) => [l.createdAt, l.ref, l.type, l.status, l.name, l.email, l.phone, l.company, l.message,
    Object.entries(l.data ?? {}).filter(([, v]) => v?.length).map(([k, v]) => `${k}: ${[v].flat().join(', ')}`).join(' | ')]);
  return `﻿${[head, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')}`;
}

function sendFile(res, path, type, headers) {
  if (!existsSync(path)) throw fail(404, 'No encontrado');
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': statSync(path).size, ...headers });
  createReadStream(path).pipe(res);
}
const attachment = (name) => `attachment; filename="${name.replace(/[^\x20-\x7e]|"/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`;

/* Rutas */
export async function handle(req, res, url) {
  const parts = url.pathname.split('/').filter(Boolean).slice(1); // sin "api"
  const [first, second, third, fourth] = parts;
  const method = req.method === 'HEAD' ? 'GET' : req.method;

  // Protección CSRF: las escrituras exigen cabecera propia y mismo origen.
  if (method !== 'GET') {
    const origin = req.headers.origin;
    if (req.headers['x-requested-with'] !== 'fuco' || (origin && new URL(origin).host !== req.headers.host)) throw fail(403, 'Solicitud no permitida');
  }

  if (first === 'availability' && method === 'GET') return json(res, 200, { blocked: db.blocked.filter((d) => d >= today()) });
  if (first === 'config' && method === 'GET') return json(res, 200, db.config.showPrices ? db.config : { showPrices: false, rates: {} });

  if (first === 'leads' && method === 'POST') {
    limit(req, 'leads', Number(process.env.LEADS_LIMIT) || 8);
    const body = await readJson(req);
    if (text(body.website)) return json(res, 201, { ref: newRef() }); // trampa para bots
    const type = body.type === 'cotizacion' ? 'cotizacion' : 'contacto';
    const lead = { type, lang: body.lang === 'en' ? 'en' : 'es', name: text(body.name, 100), email: text(body.email, 160), phone: text(body.phone, 40), company: text(body.company, 120), message: text(body.message, 4000) };
    if (lead.name.length < 2) throw fail(422, 'Falta el nombre');
    if (!/^[^\s@<>",;]+@[^\s@<>",;]+\.[^\s@<>",;]{2,}$/.test(lead.email)) throw fail(422, 'Correo inválido');
    if (type === 'contacto' && !lead.message) throw fail(422, 'Falta el mensaje');
    if (body.consent !== true) throw fail(422, 'Falta aceptar el uso de datos');
    if (type === 'cotizacion') {
      const d = body.data ?? {};
      lead.data = Object.fromEntries(['services', 'format', 'duration', 'deliverables', 'location', 'date', 'budget', 'estimate'].map((k) => [k, text(d[k], 400)]));
      if (!lead.data.services) throw fail(422, 'Elige al menos un servicio');
      if (lead.data.date && (!isDate(lead.data.date) || lead.data.date < today() || db.blocked.includes(lead.data.date))) throw fail(422, 'Esa fecha no está disponible');
      lead.data.references = (Array.isArray(d.references) ? d.references : []).slice(0, 41).map((r) => text(r, 300)).filter(Boolean);
    }
    return json(res, 201, { ref: addLead(lead).ref });
  }

  if (first === 'gallery') {
    if (second === 'open' && method === 'POST') {
      limit(req, 'gallery', 20);
      const g = galleries.find((await readJson(req)).code);
      if (!g) throw fail(404, 'Código no encontrado');
      return json(res, 200, { code: g.code, title: g.title, client: g.client, favorites: g.favorites, comment: g.comment, photos: g.photos.map(({ id, name, w, h }) => ({ id, name, w, h })) });
    }
    const isAdmin = !!session(req);
    const g = galleries.find(second, { includeExpired: isAdmin });
    if (!g) { limit(req, 'gallery-miss', 30); throw fail(404, 'Galería no encontrada'); }
    if (third === 'photo' && method === 'GET') {
      const size = url.searchParams.get('size');
      const f = galleries.photoFile(g, fourth, size);
      if (!f) throw fail(404, 'Foto no encontrada');
      const original = size === 'original';
      return sendFile(res, f.path, original ? `image/${f.photo.ext === 'jpg' ? 'jpeg' : f.photo.ext}` : 'image/webp',
        { 'Cache-Control': 'private, max-age=3600', ...(original ? { 'Content-Disposition': attachment(f.photo.name) } : {}) });
    }
    if (third === 'zip' && method === 'GET') {
      const ids = url.searchParams.get('ids')?.split(',');
      const files = g.photos.filter((p) => !ids || ids.includes(p.id)).map((p) => ({ name: p.name, path: galleries.photoFile(g, p.id, 'original').path })).filter((f) => existsSync(f.path));
      if (!files.length) throw fail(404, 'No hay fotos para descargar');
      res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': attachment(`FUCO-${g.code}.zip`), 'Cache-Control': 'no-store' });
      return sendZip(res, files);
    }
    if (third === 'selection' && method === 'POST') {
      limit(req, 'selection', 12);
      const body = await readJson(req);
      const valid = new Set(g.photos.map((p) => p.id));
      g.favorites = [...new Set(Array.isArray(body.favorites) ? body.favorites : [])].filter((id) => valid.has(id));
      g.comment = text(body.comment, 2000);
      if (!g.favorites.length) throw fail(422, 'Selecciona al menos una foto');
      addLead({ type: 'seleccion', name: g.client || g.title, email: '', message: g.comment, data: { gallery: `${g.title} (${g.code})`, photos: g.photos.filter((p) => g.favorites.includes(p.id)).map((p) => p.name) } });
      return json(res, 200, { ok: true });
    }
  }

  if (first === 'admin') {
    if (second === 'login' && method === 'POST') {
      limit(req, 'login', 8);
      const password = text((await readJson(req)).password, 200);
      if (!timingSafeEqual(derive(password, admin.salt), Buffer.from(admin.hash, 'hex'))) throw fail(401, 'Contraseña incorrecta');
      for (const [k, v] of sessions) if (v < Date.now()) sessions.delete(k);
      const token = randomBytes(32).toString('hex');
      sessions.set(token, Date.now() + SESSION_MS);
      return json(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, token, SESSION_MS / 1000) });
    }
    const token = session(req);
    if (!token) throw fail(401, 'Inicia sesión');
    if (second === 'logout' && method === 'POST') { sessions.delete(token); return json(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, '', 0) }); }
    if (second === 'state' && method === 'GET') {
      const opts = (list) => list.map((o) => ({ id: o.id, label: o.es }));
      return json(res, 200, { leads: db.leads, galleries: db.galleries, blocked: db.blocked, config: db.config,
        options: { services: services.map((s) => ({ id: s.id, label: s.title.es })), duration: opts(quoteOptions.duration), deliverables: opts(quoteOptions.deliverables) } });
    }
    if (second === 'leads.csv' && method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': attachment(`fuco-solicitudes-${today()}.csv`), 'Cache-Control': 'no-store' });
      return res.end(csv());
    }
    if (second === 'leads' && third) {
      const lead = db.leads.find((l) => l.id === third);
      if (!lead) throw fail(404, 'No encontrada');
      if (method === 'PATCH') {
        const { status } = await readJson(req);
        if (!['nuevo', 'contactado', 'cotizado', 'ganado', 'descartado'].includes(status)) throw fail(422, 'Estado inválido');
        lead.status = status; save(); return json(res, 200, { ok: true });
      }
      if (method === 'DELETE') { db.leads = db.leads.filter((l) => l !== lead); save(); return json(res, 200, { ok: true }); }
    }
    if (second === 'availability' && method === 'PUT') {
      const { blocked } = await readJson(req);
      if (!Array.isArray(blocked)) throw fail(422, 'Datos inválidos');
      db.blocked = [...new Set(blocked.filter((d) => typeof d === 'string' && isDate(d)))].sort().slice(-1000);
      save(); return json(res, 200, { ok: true });
    }
    if (second === 'config' && method === 'PUT') {
      const body = await readJson(req);
      const numbers = (o) => Object.fromEntries(Object.entries(o ?? {}).filter(([k, v]) => /^[a-z]{1,20}$/.test(k) && Number.isFinite(v) && v >= 0 && v <= 1e9));
      db.config = { showPrices: body.showPrices === true, rates: { services: numbers(body.rates?.services), duration: numbers(body.rates?.duration), deliverables: numbers(body.rates?.deliverables) } };
      save(); return json(res, 200, { ok: true });
    }
    if (second === 'galleries') {
      if (!third && method === 'POST') {
        const body = await readJson(req);
        const title = text(body.title, 120);
        if (!title) throw fail(422, 'Falta el nombre de la galería');
        return json(res, 201, galleries.create({ title, client: text(body.client, 120), expires: isDate(body.expires ?? '') ? body.expires : '' }));
      }
      const g = galleries.find(third, { includeExpired: true });
      if (!g) throw fail(404, 'Galería no encontrada');
      if (fourth === 'photos' && method === 'PUT') {
        if (g.photos.length >= 600) throw fail(422, 'La galería alcanzó el máximo de 600 fotos');
        const buffer = await readBody(req, 40 * 1024 * 1024);
        try { return json(res, 201, await galleries.addPhoto(g, buffer, url.searchParams.get('name'))); }
        catch (err) { throw err.status ? err : fail(415, 'No se pudo leer la imagen'); }
      }
      if (fourth === 'photos' && parts[4] && method === 'DELETE') {
        if (!(await galleries.removePhoto(g, parts[4]))) throw fail(404, 'Foto no encontrada');
        return json(res, 200, { ok: true });
      }
      if (!fourth && method === 'DELETE') { await galleries.remove(g); return json(res, 200, { ok: true }); }
    }
  }
  throw fail(404, 'Ruta no encontrada');
}
