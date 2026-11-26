import { el, $, $$, t, url, store, toast, overlay, copy } from './util.js';

const KEY = 'fuco:mood';
export const mood = {
  all: () => store.get(KEY, []).filter((i) => i && typeof i.key === 'string' && String(i.thumb).startsWith('/') && String(i.href).startsWith('/')),
  has: (key) => mood.all().some((i) => i.key === key),
  toggle(item) {
    const list = mood.all();
    const at = list.findIndex((i) => i.key === item.key);
    if (at >= 0) list.splice(at, 1); else list.push(item);
    store.set(KEY, list.slice(-40));
    toast(at >= 0 ? t('Quitado del moodboard', 'Removed from moodboard') : t('Guardado en tu moodboard', 'Saved to your moodboard'));
    mood.sync();
    return at < 0;
  },
  sync() {
    const keys = new Set(mood.all().map((i) => i.key));
    for (const b of $$('[data-fav]')) b.setAttribute('aria-pressed', keys.has(JSON.parse(b.dataset.fav).key));
    const badge = $('[data-mood-count]');
    if (badge) { badge.textContent = keys.size; badge.hidden = !keys.size; }
    document.dispatchEvent(new CustomEvent('mood:change'));
  },
};

export function openMood() {
  const { dlg, open } = overlay('ov--drawer', 'Moodboard');
  const list = el('ul');
  const quote = el('a', { class: 'btn btn--solid', href: url('/cotizar/') }, t('Cotizar con estas referencias', 'Quote with these references'));
  const share = el('button', { type: 'button', class: 'btn', onclick: () => copy(mood.all().map((i) => `${i.title}: ${location.origin}${i.href}`).join('\n'), t('Lista copiada', 'List copied')) }, t('Copiar lista', 'Copy list'));
  const footer = el('footer', {}, quote, share);
  function render() {
    const items = mood.all();
    footer.hidden = !items.length;
    list.replaceChildren(...(items.length
      ? items.map((i) => el('li', {}, el('a', { href: i.href }, el('img', { src: i.thumb, alt: '' }), el('span', {}, i.title)),
        el('button', { type: 'button', 'aria-label': `${t('Quitar', 'Remove')}: ${i.title}`, onclick: () => { mood.toggle(i); render(); } }, '×')))
      : [el('li', { class: 'mood__empty' }, t('Aún no guardas referencias. Toca el corazón en cualquier foto o proyecto para armar tu moodboard y adjuntarlo a la cotización.', 'No references yet. Tap the heart on any photo or project to build a moodboard and attach it to your quote.'))]));
  }
  dlg.append(el('div', { class: 'mood' }, el('header', {}, el('h2', {}, 'Moodboard'), el('p', {}, t('Tus referencias se guardan en este navegador.', 'Your references are saved in this browser.'))), list, footer));
  render();
  open();
}
