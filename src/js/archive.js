// Muro infinito de fotos: se arrastra en cualquier dirección y se repite sin bordes.
import { $, el, t, reduced, siteData, clamp } from './lib/util.js';
import { lightbox } from './lib/lightbox.js';
import { mood } from './lib/mood.js';

const root = $('[data-archive]');
const plane = $('[data-plane]', root);
const filters = $('[data-archive-filters]', root);
const counter = $('[data-archive-count]', root);
const data = await siteData();
const all = data.projects.flatMap((p) => p.photos.map((ph, k) => ({ ...ph, cats: p.cats, title: p.title, client: p.client, url: p.url, k })));
// Mezcla estable para que no queden juntas las fotos del mismo proyecto.
const mixed = all.map((p, i) => [p, (i * 37) % all.length]).sort((a, b) => a[1] - b[1]).map(([p]) => p);

let list = mixed, tiles = [], periodX = 1, heights = [];
let x = 0, y = 0, vx = reduced ? 0 : -0.35, vy = reduced ? 0 : -0.2;

function build() {
  const w = innerWidth, gap = w < 700 ? 10 : 18;
  const colW = w < 700 ? Math.round(w * 0.46) : clamp(Math.round(w / 5), 240, 340);
  const cols = Math.ceil(w / (colW + gap)) + 2;
  periodX = cols * (colW + gap);
  // Se repite la selección hasta cubrir al menos dos pantallas por columna.
  const minItems = cols * (Math.ceil((innerHeight * 1.6) / (colW * 0.9)) + 2);
  const pool = [];
  while (pool.length < Math.max(minItems, list.length)) pool.push(...list.map((p, i) => ({ p, i })));
  heights = Array(cols).fill(0);
  tiles = pool.map(({ p, i }, n) => {
    const col = heights.indexOf(Math.min(...heights));
    const h = Math.round(colW * clamp(p.h / p.w, 0.62, 1.55));
    const img = el('img', { alt: `${p.title} — ${p.client}`, draggable: 'false', decoding: 'async' });
    const node = el('button', { type: 'button', class: 'tile', 'data-i': i, tabindex: n < list.length ? '0' : '-1', 'data-cursor': t('Ampliar', 'Open') }, img, el('span', {}, `${p.client} · ${p.title}`));
    node.style.width = `${colW}px`; node.style.height = `${h}px`; node.style.background = p.color;
    const tile = { node, img, src: p.thumb, col, bx: col * (colW + gap), by: heights[col], w: colW, h };
    heights[col] += h + gap;
    node.addEventListener('focus', () => {
      if (!node.matches(':focus-visible')) return;
      x = innerWidth / 2 - tile.bx - tile.w / 2; y = innerHeight / 2 - tile.by - tile.h / 2; vx = vy = 0;
    });
    return tile;
  });
  plane.replaceChildren(...tiles.map((tile) => tile.node));
  counter.textContent = `${list.length} ${t('imágenes', 'images')}`;
}
const mod = (v, m) => ((v % m) + m) % m;
function paint() {
  for (const tile of tiles) {
    const margin = (periodX - innerWidth) / 2;
    const px = mod(tile.bx + x + margin, periodX) - margin;
    const total = heights[tile.col];
    const py = mod(tile.by + y + tile.h, total) - tile.h;
    tile.node.style.transform = `translate3d(${px}px, ${py}px, 0)`;
    if (!tile.img.src && px < innerWidth + 200 && px > -tile.w - 200 && py < innerHeight + 200 && py > -tile.h - 200) tile.img.src = tile.src;
  }
}

let drag = null, moved = 0, paused = false;
root.addEventListener('pointerdown', (e) => {
  if (e.target.closest('.archive__ui') || e.button) return;
  drag = { x: e.clientX, y: e.clientY }; moved = 0; vx = vy = 0;
});
addEventListener('pointermove', (e) => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag = { x: e.clientX, y: e.clientY };
  moved += Math.abs(dx) + Math.abs(dy);
  x += dx; y += dy; vx = dx; vy = dy;
  if (moved > 6) root.classList.add('is-dragging');
});
const release = () => { drag = null; root.classList.remove('is-dragging'); };
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
root.addEventListener('wheel', (e) => { e.preventDefault(); x -= e.deltaX; y -= e.deltaY; vx = -e.deltaX * 0.12; vy = -e.deltaY * 0.12; }, { passive: false });
addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return;
  const dir = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
  if (!dir) return;
  e.preventDefault(); vx = dir[0] * 22; vy = dir[1] * 22;
});
plane.addEventListener('pointerover', () => { paused = true; });
plane.addEventListener('pointerleave', () => { paused = false; });
plane.addEventListener('click', (e) => {
  const node = e.target.closest('.tile');
  if (!node || (moved > 8 && e.detail !== 0)) return;
  vx = vy = 0;
  lightbox(list.map((p) => ({ full: p.full, thumb: p.thumb, caption: `${p.title} — ${p.client}`, href: p.url, photo: p })), Number(node.dataset.i), {
    actions: (item) => {
      const p = item.photo;
      const save = el('button', { type: 'button', class: 'tool', onclick: () => { mood.toggle({ key: p.key, title: `${p.title} — ${p.client}`, thumb: p.thumb, href: p.url }); label(); } });
      const label = () => { save.textContent = mood.has(p.key) ? '♥' : '♡'; save.setAttribute('aria-label', t('Guardar en moodboard', 'Save to moodboard')); };
      label();
      return [save, el('a', { class: 'tool', href: p.url }, t('Ver proyecto', 'View project'))];
    },
  });
});

filters.append(...[['all', t('Todo', 'All')], ...Object.entries(data.categories)].map(([key, label]) => el('button', {
  type: 'button', class: 'chip', 'data-k': key, 'aria-pressed': key === 'all' ? 'true' : 'false',
  onclick: (e) => {
    for (const c of filters.children) c.setAttribute('aria-pressed', c === e.currentTarget);
    list = key === 'all' ? mixed : mixed.filter((p) => p.cats.includes(key));
    x = y = 0; build(); paint();
  },
}, label)));

let resizeTimer;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(build, 200); });
build();
(function loop() {
  if (!drag && !document.querySelector('dialog[open]')) {
    x += vx; y += vy;
    // Inercia que vuelve a una deriva lenta.
    const idleX = reduced || paused ? 0 : -0.35, idleY = reduced || paused ? 0 : -0.2;
    vx += (idleX - vx) * 0.06; vy += (idleY - vy) * 0.06;
  }
  paint();
  requestAnimationFrame(loop);
})();
