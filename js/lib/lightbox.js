import { el, t, overlay, clamp, copy } from './util.js';

/**
 * Visor de fotos con zoom (rueda, doble clic, pellizco), arrastre, deslizamiento y teclado.
 * items: [{ full, thumb, caption, href? }], actions: (item, index) => nodos para la barra.
 */
export function lightbox(items, start = 0, { actions } = {}) {
  let i = start, scale = 1, x = 0, y = 0, img;
  const pointers = new Map();
  let gesture = null;
  const { dlg, open } = overlay('ov--lightbox', t('Visor de fotos', 'Photo viewer'));
  const count = el('span', { class: 'lb__count' });
  const cap = el('span', { class: 'lb__cap' });
  const extra = el('span', { class: 'lb__actions' });
  const stage = el('div', { class: 'lb__stage' });
  const prev = el('button', { type: 'button', class: 'lb__nav lb__nav--p', 'aria-label': t('Anterior', 'Previous'), onclick: () => go(i - 1) }, '←');
  const next = el('button', { type: 'button', class: 'lb__nav lb__nav--n', 'aria-label': t('Siguiente', 'Next'), onclick: () => go(i + 1) }, '→');
  const share = el('button', { type: 'button', class: 'tool', onclick: () => copy(new URL(items[i].href ?? items[i].full, location.origin).href, t('Enlace copiado', 'Link copied')) }, t('Copiar enlace', 'Copy link'));
  const thumbs = el('div', { class: 'lb__thumbs' }, items.map((it, k) => el('button', { type: 'button', 'aria-label': `${k + 1}`, onclick: () => go(k) }, el('img', { src: it.thumb, alt: '', loading: 'lazy' }))));
  if (items.length < 2) { prev.hidden = next.hidden = thumbs.hidden = true; }
  stage.append(prev, next);
  dlg.append(el('div', { class: 'lb' }, el('div', { class: 'lb__bar' }, count, cap, extra, share), stage, thumbs));

  const apply = () => { img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`; img.classList.toggle('is-zoomed', scale > 1); };
  const reset = () => { scale = 1; x = y = 0; apply(); };
  function zoom(to, cx, cy) {
    const r = stage.getBoundingClientRect();
    const px = cx - r.left - r.width / 2, py = cy - r.top - r.height / 2;
    const s = clamp(to, 1, 5);
    x = px - ((px - x) * s) / scale; y = py - ((py - y) * s) / scale; scale = s;
    if (s === 1) x = y = 0;
    apply();
  }
  function go(k) {
    i = (k + items.length) % items.length;
    img?.remove();
    img = el('img', { class: 'lb__img', src: items[i].full, alt: items[i].caption || '', draggable: 'false' });
    stage.prepend(img);
    reset();
    count.textContent = `${i + 1} / ${items.length}`;
    cap.textContent = items[i].caption || '';
    extra.replaceChildren(...(actions?.(items[i], i) ?? []));
    [...thumbs.children].forEach((b, n) => b.setAttribute('aria-current', n === i));
    thumbs.children[i]?.scrollIntoView({ block: 'nearest', inline: 'center' });
    for (const n of [i - 1, i + 1]) { const it = items[(n + items.length) % items.length]; new Image().src = it.full; }
  }

  stage.addEventListener('wheel', (e) => { e.preventDefault(); zoom(scale * Math.exp(-e.deltaY * 0.0022), e.clientX, e.clientY); }, { passive: false });
  // La captura del puntero cambia el destino del evento: se comprueba la posición sobre la foto.
  stage.addEventListener('dblclick', (e) => {
    const r = img.getBoundingClientRect();
    if (!e.target.closest('button') && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) zoom(scale > 1 ? 1 : 2.5, e.clientX, e.clientY);
  });
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, e);
    const [a, b] = [...pointers.values()];
    gesture = b
      ? { type: 'pinch', d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), s: scale }
      : { type: 'drag', sx: e.clientX, sy: e.clientY, x, y, onImage: e.target === img };
  });
  stage.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, e);
    const [a, b] = [...pointers.values()];
    if (gesture?.type === 'pinch' && b) zoom(gesture.s * (Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / gesture.d), (a.clientX + b.clientX) / 2, (a.clientY + b.clientY) / 2);
    else if (gesture?.type === 'drag') {
      if (scale > 1) { x = gesture.x + e.clientX - gesture.sx; y = gesture.y + e.clientY - gesture.sy; apply(); }
      else img.style.transform = `translateX(${e.clientX - gesture.sx}px)`;
    }
  });
  const end = (e) => {
    if (!pointers.delete(e.pointerId)) return;
    if (gesture?.type === 'drag' && scale === 1) {
      const dx = e.clientX - gesture.sx, dy = e.clientY - gesture.sy;
      if (Math.abs(dx) > 60 && items.length > 1) go(i + (dx < 0 ? 1 : -1));
      else {
        apply();
        // Clic fuera de la foto cierra el visor.
        if (!gesture.onImage && Math.hypot(dx, dy) < 6 && e.type === 'pointerup') dlg.close();
      }
    }
    gesture = null;
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(i + 1);
    else if (e.key === 'ArrowLeft') go(i - 1);
    else if (e.key === '+' || e.key === '=') zoom(scale * 1.4, innerWidth / 2, innerHeight / 2);
    else if (e.key === '-') zoom(scale / 1.4, innerWidth / 2, innerHeight / 2);
  });
  open();
  go(i);
}
