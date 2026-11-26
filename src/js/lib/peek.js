// Vista previa flotante para las imágenes insertadas en el texto.
// Con mouse sigue al cursor; con el dedo o el teclado se ancla junto a la imagen.
// Modos: 'mouse', 'anchored' (dedo, la ventana se puede tocar) y 'focus' (teclado).
import { $$, t, el, reduced, saveData, clamp } from './util.js';

const GAP = 36;   // separación respecto del cursor
const EDGE = 14;  // margen mínimo con los bordes de la pantalla

function arrow() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M5 12h14M13 6l6 6-6 6');
  svg.append(path);
  return svg;
}

export function peek(section) {
  const pills = section ? $$('[data-peek]', section) : [];
  if (!pills.length) return;
  const cards = new Map();
  let active = null, mode = '', openedAt = 0, pointer = null;
  let x = 0, y = 0, tx = 0, ty = 0, frame = 0;

  function build(pill) {
    if (cards.has(pill)) return cards.get(pill);
    const { poster, client, title, videoSd, videoHd, start } = pill.dataset;
    const video = videoSd && !reduced && !saveData ? el('video', { playsinline: true, loop: true, preload: 'none' }) : null;
    const bar = el('i', { class: 'peek__bar' });
    const node = el('a', { class: `peek${video ? ' has-video' : ''}`, href: pill.getAttribute('href'), tabindex: '-1', 'aria-hidden': 'true' },
      el('div', { class: 'peek__box' },
        el('img', { src: poster, alt: '', decoding: 'async' }),
        video,
        el('i', { class: 'peek__shade' }),
        el('i', { class: 'peek__frame' }),
        el('span', { class: 'peek__tag' }, video ? 'Video' : t('Foto', 'Photo')),
        el('div', { class: 'peek__info' }, el('span', {}, el('small', {}, client), el('strong', {}, title)), el('b', {}, arrow())),
        video && bar));
    if (video) {
      video.muted = video.defaultMuted = true;
      video.addEventListener('playing', () => node.classList.add('is-playing'));
      video.addEventListener('timeupdate', () => { if (video.duration) bar.style.transform = `scaleX(${video.currentTime / video.duration})`; });
    }
    document.body.append(node);
    const card = { node, video, source: (navigator.connection?.downlink < 4 ? videoSd : videoHd), start: Number(start) || 0 };
    cards.set(pill, card);
    return card;
  }

  const size = () => {
    const w = Math.round(Math.min(innerWidth - EDGE * 2, clamp(innerWidth * 0.32, 300, 500), (innerHeight * 0.42 * 16) / 9));
    return { w, h: (w * 9) / 16 };
  };
  const header = () => (document.querySelector('.hdr')?.getBoundingClientRect().bottom ?? 0);

  function aim() {
    const { w, h } = size();
    const top = Math.max(EDGE, header() + 6);
    let cx, cy;
    if (mode === 'mouse') {
      cx = pointer.x - w / 2;
      cy = pointer.y - h - GAP;
      if (cy < top) cy = pointer.y + GAP;
    } else {
      const r = active.getBoundingClientRect();
      cx = r.left + r.width / 2 - w / 2;
      cy = r.bottom + 14;
      if (cy + h > innerHeight - EDGE) cy = r.top - h - 14;
    }
    tx = clamp(cx, EDGE, Math.max(EDGE, innerWidth - w - EDGE));
    ty = clamp(cy, top, Math.max(top, innerHeight - h - EDGE));
  }

  function place(node) {
    const tilt = reduced || mode !== 'mouse' ? 0 : clamp((tx - x) * 0.035, -5, 5);
    node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${tilt.toFixed(2)}deg)`;
  }
  function follow() {
    frame = 0;
    if (!active) return;
    const ease = reduced || mode !== 'mouse' ? 1 : 0.17;
    x += (tx - x) * ease; y += (ty - y) * ease;
    if (Math.abs(tx - x) + Math.abs(ty - y) < 0.3) { x = tx; y = ty; }
    place(cards.get(active).node);
    if (x !== tx || y !== ty) frame = requestAnimationFrame(follow);
  }
  const move = () => { aim(); frame ||= requestAnimationFrame(follow); };

  function open(pill, next) {
    if (active === pill) { mode = next; return move(); }
    close();
    active = pill; mode = next; openedAt = scrollY;
    const card = build(pill);
    card.node.style.width = `${size().w}px`;
    card.node.classList.toggle('is-anchored', mode === 'anchored');
    aim();
    x = tx; y = ty + (reduced ? 0 : 18);
    place(card.node);
    card.node.getBoundingClientRect(); // fija el estado inicial antes de animar
    card.node.classList.add('is-on');
    pill.classList.add('is-active');
    section.classList.add('is-peeking');
    if (card.video) {
      if (!card.video.src) card.video.src = `${card.source}#t=${card.start}`;
      card.video.play().catch(() => {});
    }
    move();
  }

  function close() {
    if (!active) return;
    const card = cards.get(active);
    card.node.classList.remove('is-on');
    card.video?.pause();
    active.classList.remove('is-active');
    section.classList.remove('is-peeking');
    active = null;
    cancelAnimationFrame(frame); frame = 0;
  }

  const inside = (node, p) => { const r = node.getBoundingClientRect(); return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom; };

  for (const pill of pills) {
    let touched = false;
    const hover = (e) => {
      if (e.pointerType !== 'mouse') return;
      pointer = { x: e.clientX, y: e.clientY };
      open(pill, 'mouse');
    };
    pill.addEventListener('pointerenter', hover);
    pill.addEventListener('pointermove', hover);
    pill.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && active === pill) close(); });
    pill.addEventListener('pointerdown', (e) => { touched = e.pointerType !== 'mouse'; });
    // Primer toque: vista previa. Segundo toque (en la imagen o en la ventana): abre el proyecto.
    pill.addEventListener('click', (e) => {
      const first = touched && e.detail !== 0 && active !== pill;
      touched = false;
      if (!first) return;
      e.preventDefault();
      open(pill, 'anchored');
    });
    pill.addEventListener('focus', () => { if (pill.matches(':focus-visible')) open(pill, 'focus'); });
    // Solo lo abierto con teclado se cierra al perder el foco: al tocar la ventana, la imagen lo pierde antes del clic.
    pill.addEventListener('blur', () => { if (active === pill && mode === 'focus') close(); });
  }

  // Las imágenes de la vista previa se preparan antes de que haga falta.
  const near = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) { pills.forEach(build); near.disconnect(); }
  }, { rootMargin: '300px 0px' });
  near.observe(section);

  addEventListener('pointerdown', (e) => { if (active && !e.target.closest?.('[data-peek], .peek')) close(); }, { passive: true });
  addEventListener('scroll', () => {
    if (!active) return;
    if (mode === 'mouse') { if (!inside(active, pointer)) close(); return; }
    if (Math.abs(scrollY - openedAt) > 140) close(); else move();
  }, { passive: true });
  addEventListener('resize', close);
  addEventListener('blur', close);
  addEventListener('pagehide', close);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
}
