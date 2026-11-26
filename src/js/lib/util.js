export const $ = (s, root = document) => root.querySelector(s);
export const $$ = (s, root = document) => [...root.querySelectorAll(s)];
export const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
export const t = (es, en) => (lang === 'en' ? en : es);
export const url = (path) => (lang === 'en' ? `/en${path}` : path);
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const saveData = !!navigator.connection?.saveData;
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Crea elementos sin usar innerHTML (el texto siempre se inserta como texto). */
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else if (k === 'class') node.className = v;
    else node.setAttribute(k, v === true ? '' : v);
  }
  node.append(...children.flat().filter((c) => c != null && c !== false));
  return node;
}

export const store = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* almacenamiento no disponible */ } },
};

let toastTimer;
export function toast(message) {
  const node = $('.toast');
  if (!node) return;
  // Si hay un diálogo abierto, el aviso debe vivir dentro para quedar por encima.
  const host = $$('dialog[open]').at(-1) ?? document.body;
  if (node.parentElement !== host) host.append(node);
  node.textContent = message;
  requestAnimationFrame(() => node.classList.add('is-on'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove('is-on'), 2600);
}

export async function copy(text, ok = t('Copiado', 'Copied')) {
  try { await navigator.clipboard.writeText(text); toast(ok); }
  catch { toast(text); }
}

let dataPromise;
export const siteData = () => (dataPromise ??= fetch(`/data/site.${lang}.json`).then((r) => r.json()));

export async function api(path, { method = 'GET', body, raw } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'X-Requested-With': 'fuco', ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status });
  return data;
}

export const scroll = { lenis: null };
export function lock(on) {
  document.body.classList.toggle('is-locked', on);
  on ? scroll.lenis?.stop() : scroll.lenis?.start();
}

/** Diálogo a pantalla completa con bloqueo de desplazamiento y cierre limpio. */
export function overlay(cls, label, onClose) {
  const dlg = el('dialog', { class: `ov ${cls}`, 'aria-label': label, 'data-lenis-prevent': true });
  const close = () => dlg.open && dlg.close();
  const x = el('button', { class: 'ov__x', type: 'button', 'aria-label': t('Cerrar', 'Close'), onclick: close }, '×');
  dlg.append(x);
  dlg.addEventListener('close', () => {
    const toastNode = $('.toast', dlg);
    if (toastNode) document.body.append(toastNode);
    dlg.remove();
    if (!$('dialog[open]')) lock(false);
    onClose?.();
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close(); });
  document.body.append(dlg);
  return { dlg, close, open: () => { dlg.showModal(); lock(true); } };
}
