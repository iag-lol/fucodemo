// Servidor de FUCO Estudio: sirve dist/ y la API. Uso: npm start
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, sep, resolve } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

try { process.loadEnvFile(new URL('.env', import.meta.url)); } catch { /* .env es opcional */ }

const { handle, json } = await import('./server/api.mjs');
const { seedDemo } = await import('./server/galleries.mjs');

const DIST = new URL('dist', import.meta.url).pathname;
const PORT = Number(process.env.PORT) || 4321;
const HOST = process.env.HOST || '127.0.0.1';

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('No existe dist/. Ejecuta primero: npm run build');
  process.exit(1);
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2',
};
const COMPRESSIBLE = new Set(['.html', '.css', '.js', '.json', '.webmanifest', '.xml', '.txt', '.svg']);
const REDIRECTS = { '/about': '/nosotros/', '/estudio': '/nosotros/', '/en/estudio': '/en/nosotros/', '/clients': '/proyectos/', '/contact': '/contacto/' };
const SECURITY = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};
const compressed = new Map();

function serveFile(req, res, file, status = 200) {
  const info = statSync(file);
  const ext = extname(file).toLowerCase();
  const path = file.slice(DIST.length);
  const etag = `W/"${info.size.toString(36)}-${Math.round(info.mtimeMs).toString(36)}"`;
  const headers = {
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
    'Cache-Control': /^\/(fonts|vendor)\//.test(path) ? 'public, max-age=31536000, immutable'
      : path.startsWith('/media/') ? 'public, max-age=86400' : 'no-cache',
    ETag: etag,
  };
  if (status === 200 && req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }

  if (COMPRESSIBLE.has(ext)) {
    const accept = req.headers['accept-encoding'] ?? '';
    const enc = /\bbr\b/.test(accept) ? 'br' : /\bgzip\b/.test(accept) ? 'gzip' : null;
    const key = `${file}:${etag}:${enc}`;
    let body = compressed.get(key);
    if (!body) {
      const raw = readFileSync(file);
      body = enc === 'br' ? brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 6 } }) : enc === 'gzip' ? gzipSync(raw) : raw;
      if (compressed.size > 500) compressed.clear();
      compressed.set(key, body);
    }
    res.writeHead(status, { ...headers, Vary: 'Accept-Encoding', ...(enc ? { 'Content-Encoding': enc } : {}), 'Content-Length': body.length });
    return res.end(req.method === 'HEAD' ? undefined : body);
  }

  // Rangos: necesarios para adelantar videos (y para reproducirlos en Safari).
  headers['Accept-Ranges'] = 'bytes';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  let start = 0, end = info.size - 1;
  if (range && (range[1] || range[2])) {
    if (range[1]) { start = Number(range[1]); if (range[2]) end = Math.min(Number(range[2]), end); }
    else start = Math.max(0, info.size - Number(range[2]));
    if (start > end || start >= info.size) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); return res.end(); }
    status = 206;
    headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
  }
  headers['Content-Length'] = info.size ? end - start + 1 : 0;
  res.writeHead(status, headers);
  if (req.method === 'HEAD' || !info.size) return res.end();
  const stream = createReadStream(file, { start, end });
  stream.on('error', () => res.destroy());
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}

const isFile = (f) => { try { return statSync(f).isFile(); } catch { return false; } };

const server = createServer(async (req, res) => {
  for (const [k, v] of Object.entries(SECURITY)) res.setHeader(k, v);
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await handle(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Método no permitido' });

    const pathname = decodeURIComponent(url.pathname);
    const old = REDIRECTS[pathname.replace(/\/$/, '')];
    if (old) { res.writeHead(301, { Location: old }); return res.end(); }

    const file = resolve(DIST, `.${pathname}`);
    const inside = file === DIST || file.startsWith(DIST + sep);
    if (inside && !pathname.includes('\0')) {
      if (pathname.endsWith('/') && isFile(join(file, 'index.html'))) return serveFile(req, res, join(file, 'index.html'));
      if (!pathname.endsWith('/') && isFile(file)) return serveFile(req, res, file);
      if (!pathname.endsWith('/') && isFile(join(file, 'index.html'))) {
        // Ruta relativa al propio sitio (evita redirecciones a otros dominios).
        res.writeHead(301, { Location: `${file.slice(DIST.length).split(sep).map(encodeURIComponent).join('/')}/${url.search}` });
        return res.end();
      }
    }
    return serveFile(req, res, join(DIST, pathname.startsWith('/en/') ? 'en/404.html' : '404.html'), 404);
  } catch (err) {
    const status = err.status ?? (err instanceof URIError ? 400 : 500);
    if (status === 500) console.error(err);
    if (res.headersSent) return res.destroy();
    json(res, status, { error: status === 500 ? 'Error interno' : err.message });
  }
});

server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `El puerto ${PORT} está ocupado. Prueba: PORT=4322 npm start` : err.message);
  process.exit(1);
});
await seedDemo().catch((err) => console.error('No se pudo crear la galería de demostración:', err.message));
server.listen(PORT, HOST, () => console.log(`FUCO Estudio en http://${HOST === '127.0.0.1' ? 'localhost' : HOST}:${PORT}  ·  panel: /admin/`));
