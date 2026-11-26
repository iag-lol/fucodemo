// Comportamiento común a todas las páginas.
import { $, $$, t, reduced, fine, saveData, clamp, scroll, lock, copy, toast, base } from './lib/util.js';
import { createPlayer } from './lib/player.js';
import { lightbox } from './lib/lightbox.js';
import { mood, openMood } from './lib/mood.js';
import { openReel } from './lib/reel.js';
import { openPalette } from './lib/palette.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap?.registerPlugin(ScrollTrigger);
ScrollTrigger?.config({ ignoreMobileResize: true });
const page = document.body.dataset.page;
const animated = !!gsap && !reduced;

/* Intro */
const pre = $('.preloader');
if (pre && !document.documentElement.classList.contains('seen')) {
  const count = $('[data-count]', pre);
  const start = performance.now();
  let opened = false;
  const openIris = () => {
    if (opened) return;
    opened = true;
    pre.classList.add('is-open');
    try { sessionStorage.setItem('fuco:seen', '1'); } catch { /* sin almacenamiento */ }
    setTimeout(() => pre.remove(), 1300);
  };
  const tick = (now) => {
    const p = clamp((now - start) / 1300, 0, 1);
    count.textContent = String(Math.round(100 * (1 - (1 - p) ** 3))).padStart(3, '0');
    if (p < 1) requestAnimationFrame(tick); else openIris();
  };
  requestAnimationFrame(tick);
  setTimeout(openIris, 2600); // respaldo si la pestaña está en segundo plano
}

/* Desplazamiento suave */
if (Lenis && animated && fine && page !== 'archive') {
  const lenis = new Lenis({ lerp: 0.1, anchors: { offset: -90 } });
  scroll.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    // Lenis no termina la animación si el destino cae en medio píxel y deja bloqueados teclado y barra: se redondea.
    if (lenis.animate.isRunning) lenis.animate.to = Math.round(lenis.animate.to);
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

/* Cabecera */
const header = $('.hdr');
let lastY = scrollY;
const onScroll = () => {
  const y = scrollY;
  header?.classList.toggle('is-solid', y > 40);
  header?.classList.toggle('is-hidden', y > 500 && y > lastY && !menuOpen());
  if (Math.abs(y - lastY) > 4) lastY = y;
};
addEventListener('scroll', onScroll, { passive: true });

/* Menú móvil */
const burger = $('.burger'), menu = $('.menu');
const menuOpen = () => !!menu?.classList.contains('is-open');
function setMenu(on) {
  menu.classList.toggle('is-open', on);
  menu.inert = !on;
  $('#main').inert = on;
  burger.setAttribute('aria-expanded', on);
  lock(on);
}
burger?.addEventListener('click', () => setMenu(!menuOpen()));
menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
addEventListener('pageshow', (e) => { if (e.persisted && menuOpen()) setMenu(false); });
onScroll();

/* Apariciones al hacer scroll */
function splitWords(node, state = { d: 0 }) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      for (const part of child.textContent.split(/(\s+)/)) {
        if (!part.trim()) { frag.append(part); continue; }
        const outer = document.createElement('span'); outer.className = 'w';
        const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--d', state.d++);
        outer.append(inner); frag.append(outer);
      }
      child.replaceWith(frag);
    } else splitWords(child, state);
  }
}
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -6% 0px' });
if (!reduced) $$('[data-split], .shead h2').forEach((h) => { splitWords(h); io.observe(h); });
$$('[data-reveal]').forEach((n) => io.observe(n));

/* Parallax */
if (animated) {
  for (const box of $$('[data-parallax]')) {
    gsap.fromTo($('img', box), { yPercent: -13 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  for (const col of $$('[data-wall] [data-speed]')) {
    gsap.to(col, { yPercent: Number(col.dataset.speed), ease: 'none', scrollTrigger: { trigger: col.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
  }
}

/* Cursor con etiqueta y botones magnéticos */
const cursor = $('.cursor');
if (cursor && fine && !reduced) {
  const label = $('span', cursor);
  let tx = -200, ty = -200, cx = tx, cy = ty, running = false;
  const loop = () => {
    cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
    cursor.style.transform = `translate(${cx}px, ${cy}px)`;
    if (Math.abs(tx - cx) + Math.abs(ty - cy) > 0.2) requestAnimationFrame(loop); else running = false;
  };
  addEventListener('pointermove', (e) => {
    tx = e.clientX; ty = e.clientY;
    const target = e.target.closest?.('[data-cursor]');
    const blocked = e.target.closest?.('[data-fav], button:not([data-cursor]), input, .archive__ui');
    const on = target && !(blocked && target !== blocked);
    cursor.classList.toggle('is-on', !!on);
    if (on) label.textContent = target.dataset.cursor;
    if (!running) { running = true; requestAnimationFrame(loop); }
  }, { passive: true });
  addEventListener('pointerdown', () => cursor.classList.add('is-down'));
  addEventListener('pointerup', () => cursor.classList.remove('is-down'));
  document.documentElement.addEventListener('pointerleave', () => cursor.classList.remove('is-on'));
}
if (animated && fine) {
  for (const btn of $$('[data-magnetic]')) {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
    btn.addEventListener('pointermove', (e) => { const r = btn.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.22); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
    btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  }
}
for (const card of $$('[data-tilt]')) {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    card.style.setProperty('--mx', `${px * 100}%`); card.style.setProperty('--my', `${py * 100}%`);
    if (!reduced) card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 4}deg) rotateY(${(px - 0.5) * 4}deg)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
}

/* Vista previa de video en las tarjetas */
function preview(host, video, srcAttr, on) {
  if (on) {
    if (reduced || saveData) return;
    if (!video.src) video.src = video.dataset[srcAttr];
    video.play().then(() => host.classList.add('is-playing')).catch(() => {});
  } else { video.pause(); host.classList.remove('is-playing'); }
}
// En pantallas táctiles solo se reproduce el video más visible (menos datos y batería).
const ratios = new Map();
const inView = new IntersectionObserver((entries) => {
  for (const e of entries) ratios.set(e.target, e.intersectionRatio);
  let best = null, top = 0.6;
  for (const [node, ratio] of ratios) if (ratio > top) { best = node; top = ratio; }
  for (const node of ratios.keys()) {
    const video = node.querySelector('video');
    if (node !== best && video.paused) continue;
    preview(node, video, video.dataset.autoSrc ? 'autoSrc' : 'hoverSrc', node === best);
  }
}, { threshold: [0, 0.35, 0.6, 0.75, 0.9, 1] });
for (const card of $$('[data-card]')) {
  const video = $('video', card);
  if (!video) continue;
  if (fine) {
    card.addEventListener('pointerenter', () => preview(card, video, 'hoverSrc', true));
    card.addEventListener('pointerleave', () => preview(card, video, 'hoverSrc', false));
  } else inView.observe(card);
}
for (const phone of $$('.phone')) {
  const video = $('video', phone);
  if (fine) {
    phone.addEventListener('pointerenter', () => preview(phone, video, 'autoSrc', true));
    phone.addEventListener('pointerleave', () => preview(phone, video, 'autoSrc', false));
  } else inView.observe(phone);
}

/* Filas arrastrables */
for (const row of $$('[data-drag]')) {
  let startX = 0, startLeft = 0, down = false, moved = false;
  row.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse' || e.button) return; down = true; moved = false; startX = e.clientX; startLeft = row.scrollLeft; });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    if (Math.abs(e.clientX - startX) > 6) { moved = true; row.classList.add('is-dragging'); }
    if (moved) row.scrollLeft = startLeft - (e.clientX - startX);
  });
  addEventListener('pointerup', () => { down = false; row.classList.remove('is-dragging'); });
  row.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  row.addEventListener('dragstart', (e) => e.preventDefault());
}

/* Comparador antes / después: mouse, teclado y dedo */
for (const box of $$('[data-compare]')) {
  const range = $('input', box);
  let used = false, start = null;
  const set = (v) => { range.value = v; box.style.setProperty('--pos', `${v}%`); };
  const from = (x) => { const r = box.getBoundingClientRect(); set(clamp(((x - r.left) / r.width) * 100, 0, 100)); };
  range.addEventListener('input', () => { used = true; set(range.value); });
  box.addEventListener('pointerdown', (e) => { used = true; if (e.pointerType !== 'mouse') start = { x: e.clientX, y: e.clientY, drag: false }; });
  box.addEventListener('pointermove', (e) => {
    if (!start) return;
    start.drag ||= Math.abs(e.clientX - start.x) > 6 && Math.abs(e.clientX - start.x) > Math.abs(e.clientY - start.y);
    if (start.drag) from(e.clientX);
  });
  box.addEventListener('pointerup', (e) => { if (start) from(e.clientX); start = null; });
  box.addEventListener('pointercancel', () => { start = null; });
  // Demostración automática la primera vez que aparece.
  if (!reduced) new IntersectionObserver(([entry], io) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    const t0 = performance.now();
    const sweep = (now) => {
      const p = clamp((now - t0) / 2400, 0, 1);
      if (used) return;
      set(50 + Math.sin(p * Math.PI * 2) * 32 * (1 - p * 0.25));
      if (p < 1) requestAnimationFrame(sweep); else set(50);
    };
    requestAnimationFrame(sweep);
  }, { threshold: 0.55 }).observe(box);
}

/* Reproductores en la página */
const players = new Map();
for (const node of $$('[data-player]')) {
  players.set(node.dataset.id, createPlayer(node, { sources: JSON.parse(node.dataset.sources), poster: node.dataset.poster, title: node.dataset.title }));
}

/* Reloj local del estudio */
const clocks = $$('[data-clock]');
if (clocks.length) {
  const paint = () => clocks.forEach((c) => { c.textContent = new Intl.DateTimeFormat('es-CL', { timeZone: c.dataset.clock, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()); });
  paint(); setInterval(paint, 1000);
}

/* Clics delegados */
document.addEventListener('click', (e) => {
  const hit = (s) => e.target.closest(s);
  let n;
  if ((n = hit('[data-fav]'))) { e.preventDefault(); mood.toggle(JSON.parse(n.dataset.fav)); }
  else if ((n = hit('a[data-lightbox]'))) {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    e.preventDefault();
    const group = $$(`a[data-lightbox="${n.dataset.lightbox}"]`);
    lightbox(group.map((a, k) => ({ full: a.getAttribute('href'), thumb: a.dataset.thumb, caption: a.dataset.caption, href: `${location.pathname}#foto-${k + 1}` })), group.indexOf(n), {
      actions: (_, k) => {
        const fav = group[k].parentElement.querySelector('[data-fav]');
        if (!fav) return [];
        const item = JSON.parse(fav.dataset.fav);
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'tool';
        const label = () => { btn.textContent = mood.has(item.key) ? `♥ ${t('Guardada', 'Saved')}` : `♡ ${t('Guardar', 'Save')}`; };
        btn.addEventListener('click', () => { mood.toggle(item); label(); });
        label();
        return [btn];
      },
    });
  } else if ((n = hit('[data-play-video]'))) {
    const player = players.get(n.dataset.playVideo);
    if (player) {
      scroll.lenis ? scroll.lenis.scrollTo(player.root, { offset: -90 }) : player.root.scrollIntoView({ behavior: 'smooth', block: 'center' });
      player.play();
    } else openReel(n.dataset.playVideo);
  } else if (hit('[data-reel]')) openReel();
  else if (hit('[data-palette]')) openPalette();
  else if (hit('[data-mood]')) openMood();
  else if ((n = hit('[data-copy]'))) copy(n.dataset.copy);
  else if (hit('[data-share]')) {
    const data = { title: document.title, url: location.href };
    if (navigator.share) navigator.share(data).catch(() => {}); else copy(location.href, t('Enlace copiado', 'Link copied'));
  } else if (hit('[data-top]')) scroll.lenis ? scroll.lenis.scrollTo(0) : scrollTo({ top: 0, behavior: 'smooth' });
});
addEventListener('keydown', (e) => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  else if (e.key === '/' && !typing && !$('dialog[open]')) { e.preventDefault(); openPalette(); }
  else if (e.key === 'Escape' && menuOpen()) { setMenu(false); burger.focus(); }
});

mood.sync();
addEventListener('storage', () => mood.sync());
addEventListener('offline', () => toast(t('Sin conexión', 'You are offline')));

// Abrir una foto compartida: /proyectos/x/#foto-3
const shared = location.hash.match(/^#foto-(\d+)$/);
if (shared) $$('a[data-lightbox]')[shared[1] - 1]?.click();

// Recalcular cuando cargan las fuentes e imágenes
addEventListener('load', () => ScrollTrigger?.refresh());
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {});
