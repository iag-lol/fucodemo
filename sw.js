// Service worker: páginas desde la red (con respaldo sin conexión) y fotos/fuentes en caché.
const CACHE = 'fuco-19fb9da9';
const ROOT = new URL('./', self.location).pathname; // '/' o la subcarpeta donde se publica
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './css/main.css?v=19fb9da9', './media/brand/logo-fuco.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('fuco-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith(ROOT)) return;
  const path = url.pathname.slice(ROOT.length);
  if (path.startsWith('api/') || path.startsWith('admin') || path.startsWith('media/video/') || request.headers.has('range')) return;
  const immutable = path.startsWith('media/img/') || path.startsWith('fonts/') || path.startsWith('vendor/');
  const save = (res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); } return res; };
  if (immutable) e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then(save)));
  else e.respondWith(fetch(request).then(save).catch(() => caches.match(request).then((hit) => hit || caches.match('./'))));
});
