// Galería privada para clientes: ver, marcar favoritas, descargar y enviar selección.
import { $, $$, el, t, api, toast, scroll } from './lib/util.js';
import { lightbox } from './lib/lightbox.js';
import { showError } from './lib/forms.js';

const root = $('[data-client]');
const gate = $('[data-gate]', root);
const view = $('[data-view-gallery]', root);
const grid = $('[data-g-grid]', root);
const error = $('.form__error', gate);
const KEY = 'fuco:gallery';
let gallery, favs = new Set(), filter = 'all';

const photoUrl = (id, size) => `/api/gallery/${encodeURIComponent(gallery.code)}/photo/${id}?size=${size}`;
const favKey = () => `fuco:favs:${gallery.code}`;

function toggle(id) {
  favs.has(id) ? favs.delete(id) : favs.add(id);
  try { localStorage.setItem(favKey(), JSON.stringify([...favs])); } catch { /* sin almacenamiento */ }
  paint();
}
function paint() {
  for (const figure of grid.children) {
    const on = favs.has(figure.dataset.id);
    figure.classList.toggle('is-fav', on);
    figure.hidden = filter === 'fav' && !on;
    $('.fav', figure).setAttribute('aria-pressed', on);
    $('.fav', figure).textContent = on ? '♥' : '♡';
  }
  $('[data-g-favs]', view).textContent = favs.size;
  const zip = $('[data-g-zip-fav]', view);
  zip.hidden = !favs.size;
  zip.href = `/api/gallery/${encodeURIComponent(gallery.code)}/zip?ids=${[...favs].join(',')}`;
  scroll.lenis?.resize();
}
function open(id) {
  const items = gallery.photos.filter((p) => filter === 'all' || favs.has(p.id));
  lightbox(items.map((p) => ({ full: photoUrl(p.id, 'large'), thumb: photoUrl(p.id, 'thumb'), caption: p.name, href: location.pathname, id: p.id })), items.findIndex((p) => p.id === id), {
    actions: (item) => {
      const btn = el('button', { type: 'button', class: 'tool', onclick: () => { toggle(item.id); label(); } });
      const label = () => { btn.textContent = favs.has(item.id) ? `♥ ${t('Favorita', 'Favourite')}` : `♡ ${t('Marcar', 'Mark')}`; };
      label();
      return [btn, el('a', { class: 'tool', href: photoUrl(item.id, 'original'), download: '' }, t('Descargar', 'Download'))];
    },
  });
}
function render() {
  gate.hidden = true; view.hidden = false;
  $('[data-g-title]', view).textContent = gallery.title;
  $('[data-g-client]', view).textContent = gallery.client;
  $('[data-g-total]', view).textContent = gallery.photos.length;
  $('[data-g-zip-all]', view).href = `/api/gallery/${encodeURIComponent(gallery.code)}/zip`;
  $('#g-comment', view).value = gallery.comment || '';
  grid.replaceChildren(...gallery.photos.map((p) => el('figure', { 'data-id': p.id },
    el('a', { href: photoUrl(p.id, 'large'), onclick: (e) => { e.preventDefault(); open(p.id); } }, el('img', { src: photoUrl(p.id, 'thumb'), alt: p.name, width: p.w, height: p.h, loading: 'lazy' })),
    el('button', { type: 'button', class: 'fav', 'aria-label': `${t('Favorita', 'Favourite')}: ${p.name}`, onclick: () => toggle(p.id) }, '♥'),
    el('a', { class: 'dl', href: photoUrl(p.id, 'original'), download: '' }, '↓'))));
  if (!gallery.photos.length) grid.replaceChildren(el('p', {}, t('Esta galería todavía no tiene fotos.', 'This gallery has no photos yet.')));
  paint();
}
async function enter(code) {
  showError(error);
  try {
    gallery = await api('/api/gallery/open', { method: 'POST', body: { code } });
  } catch (err) {
    try { sessionStorage.removeItem(KEY); } catch { /* sin almacenamiento */ }
    return showError(error, err.status === 404 ? t('Ese código no existe o ya venció.', 'That code does not exist or has expired.')
      : err.status === 429 ? t('Demasiados intentos. Espera unos minutos.', 'Too many attempts. Please wait a few minutes.')
        : t('No pudimos abrir la galería. Intenta nuevamente.', 'We could not open the gallery. Please try again.'));
  }
  try { sessionStorage.setItem(KEY, gallery.code); favs = new Set(JSON.parse(localStorage.getItem(favKey())) ?? gallery.favorites); }
  catch { favs = new Set(gallery.favorites); }
  favs = new Set([...favs].filter((id) => gallery.photos.some((p) => p.id === id)));
  render();
}
$('[data-gate-form]', gate).addEventListener('submit', (e) => { e.preventDefault(); enter(e.target.elements.code.value.trim()); });
$$('[data-g-filter]', view).forEach((b) => b.addEventListener('click', () => {
  filter = b.dataset.gFilter;
  $$('[data-g-filter]', view).forEach((o) => o.setAttribute('aria-pressed', o === b));
  paint();
}));
$('[data-g-exit]', view).addEventListener('click', () => { try { sessionStorage.removeItem(KEY); } catch { /* */ } location.href = location.pathname; });
$('[data-g-send]', view).addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!favs.size) return toast(t('Marca al menos una foto favorita', 'Mark at least one favourite'));
  try {
    await api(`/api/gallery/${encodeURIComponent(gallery.code)}/selection`, { method: 'POST', body: { favorites: [...favs], comment: $('#g-comment', view).value } });
    toast(t(`Selección enviada (${favs.size})`, `Selection sent (${favs.size})`));
  } catch { toast(t('No se pudo enviar. Intenta de nuevo.', 'Could not send. Please try again.')); }
});

let initial = new URLSearchParams(location.search).get('code');
try { initial ||= sessionStorage.getItem(KEY); } catch { /* sin almacenamiento */ }
if (initial) enter(initial);
