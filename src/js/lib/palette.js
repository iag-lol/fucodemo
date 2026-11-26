import { el, $, t, url, overlay, siteData, copy, isStatic } from './util.js';
import { openReel } from './reel.js';
import { openMood } from './mood.js';

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export async function openPalette() {
  if ($('.ov--palette')) return;
  const data = await siteData();
  if ($('.ov--palette')) return;
  const { dlg, open, close } = overlay('ov--palette', t('Buscador', 'Search'));
  const page = (title, path, icon = '→') => ({ title, sub: t('Página', 'Page'), icon, run: () => { location.href = url(path); } });
  const action = (title, icon, run) => ({ title, sub: t('Acción', 'Action'), icon, run });
  const commands = [
    action(t('Ver showreel', 'Watch showreel'), '▶', () => openReel()),
    page(t('Cotizar un proyecto', 'Get a quote'), '/cotizar/', '✦'),
    page(t('Proyectos', 'Work'), '/proyectos/'), page(t('Servicios', 'Services'), '/servicios/'), page(t('Nosotros', 'About'), '/nosotros/'),
    page(t('Archivo visual', 'Visual archive'), '/archivo/'), page(t('Laboratorio de color', 'Colour lab'), '/lab/'), page(t('Contacto', 'Contact'), '/contacto/'),
    ...(isStatic ? [] : [page(t('Acceso clientes', 'Client access'), '/clientes/', '⚿')]),
    action(t('Abrir mi moodboard', 'Open my moodboard'), '♥', openMood),
    action(t('Copiar correo', 'Copy email'), '@', () => copy(data.contact.email)),
    action('WhatsApp', '✆', () => window.open(`https://wa.me/${data.contact.whatsapp}`, '_blank', 'noopener')),
    action('Instagram', '◎', () => window.open(data.contact.instagram, '_blank', 'noopener')),
  ];
  const projects = data.projects.map((p) => ({ title: p.title, sub: `${p.client} · ${p.catLabel}`, img: p.thumb, run: () => { location.href = p.url; } }));

  const input = el('input', { type: 'text', placeholder: t('Busca proyectos, marcas o acciones…', 'Search projects, brands or actions…'), role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'pal-list', 'aria-autocomplete': 'list', autocomplete: 'off', autofocus: true });
  const ul = el('ul', { id: 'pal-list', role: 'listbox' });
  const x = $('.ov__x', dlg); x.hidden = true;
  dlg.append(el('div', { class: 'palette' }, el('div', { class: 'palette__in' }, input, el('kbd', { onclick: close }, 'ESC')), ul));
  let results = [], sel = 0;
  const select = (k) => {
    sel = (k + results.length) % results.length;
    [...ul.children].forEach((li, n) => li.setAttribute('aria-selected', n === sel));
    ul.children[sel]?.scrollIntoView({ block: 'nearest' });
    input.setAttribute('aria-activedescendant', `pal-${sel}`);
  };
  const run = (item) => { close(); setTimeout(item.run, 0); };
  function render() {
    const q = norm(input.value.trim());
    const pool = q ? [...projects, ...commands] : [...commands, ...projects];
    results = pool.filter((r) => q.split(/\s+/).every((w) => norm(`${r.title} ${r.sub}`).includes(w)));
    if (!results.length) { ul.replaceChildren(el('p', { class: 'palette__empty' }, t('Sin resultados', 'No results'))); return; }
    ul.replaceChildren(...results.map((r, n) => el('li', { id: `pal-${n}`, role: 'option', onclick: () => run(r), onpointermove: () => { if (sel !== n) select(n); } },
      r.img ? el('img', { src: r.img, alt: '' }) : el('i', {}, r.icon), el('span', {}, el('b', {}, r.title), el('small', {}, r.sub)))));
    select(0);
  }
  input.addEventListener('input', render);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); results.length && select(sel + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); results.length && select(sel - 1); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); run(results[sel]); }
  });
  render();
  open();
  input.focus();
}
