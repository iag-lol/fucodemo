// Service worker: páginas desde la red (con respaldo sin conexión) y fotos/fuentes en caché.
const CACHE = 'fuco-__V__';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/css/main.css?v=__V__', '/media/brand/logo-fuco.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/admin') || url.pathname.startsWith('/media/video/') || request.headers.has('range')) return;
  const immutable = url.pathname.startsWith('/media/img/') || url.pathname.startsWith('/fonts/') || url.pathname.startsWith('/vendor/');
  const save = (res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(request, copy)); } return res; };
  if (immutable) e.respondWith(caches.match(request).then((hit) => hit || fetch(request).then(save)));
  else e.respondWith(fetch(request).then(save).catch(() => caches.match(request).then((hit) => hit || caches.match('/'))));
});
