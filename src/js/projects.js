// Filtros, búsqueda y vistas del portafolio, reflejados en la dirección para poder compartirlos.
import { $, $$, reduced, store, scroll } from './lib/util.js';

const grid = $('[data-grid]');
const cards = $$('[data-card]', grid);
const chips = $$('[data-cat]');
const video = $('[data-only-video]');
const search = $('[data-search-input]');
const views = $$('.views [data-view]');
const empty = $('[data-empty]');
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const params = new URLSearchParams(location.search);
const state = {
  cat: chips.some((c) => c.dataset.cat === params.get('cat')) ? params.get('cat') : 'all',
  q: params.get('q') ?? '',
  video: params.get('video') === '1',
  view: store.get('fuco:view', 'grid') === 'list' ? 'list' : 'grid',
};

function apply() {
  const words = norm(state.q).split(/\s+/).filter(Boolean);
  let shown = 0;
  for (const card of cards) {
    const ok = (state.cat === 'all' || card.dataset.cats.split(' ').includes(state.cat))
      && (!state.video || card.dataset.video === '1')
      && words.every((w) => norm(card.dataset.search).includes(w));
    card.hidden = !ok;
    shown += ok;
  }
  empty.hidden = shown > 0;
  grid.dataset.view = state.view;
  chips.forEach((c) => c.setAttribute('aria-pressed', c.dataset.cat === state.cat));
  views.forEach((v) => v.setAttribute('aria-pressed', v.dataset.view === state.view));
  video.checked = state.video;
  if (search.value !== state.q) search.value = state.q;
}
function update(patch, animate = true) {
  Object.assign(state, patch);
  const run = () => { apply(); scroll.lenis?.resize(); window.ScrollTrigger?.refresh(); };
  if (animate && !reduced && document.startViewTransition) document.startViewTransition(run); else run();
  const q = new URLSearchParams();
  if (state.cat !== 'all') q.set('cat', state.cat);
  if (state.q) q.set('q', state.q);
  if (state.video) q.set('video', '1');
  history.replaceState(null, '', q.size ? `?${q}` : location.pathname);
  store.set('fuco:view', state.view);
}
chips.forEach((c) => c.addEventListener('click', () => update({ cat: c.dataset.cat })));
views.forEach((v) => v.addEventListener('click', () => update({ view: v.dataset.view })));
video.addEventListener('change', () => update({ video: video.checked }));
search.addEventListener('input', () => update({ q: search.value }, false));
$('[data-reset]').addEventListener('click', () => update({ cat: 'all', q: '', video: false }));
apply();
