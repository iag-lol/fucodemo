// Página «Nosotros»: índice de secciones, etapas de trabajo y pestañas de equipamiento.
import { $, $$, reduced } from './lib/util.js';

/* Índice fijo: marca la sección visible */
const nav = $('[data-chapters]');
if (nav) {
  const strip = nav.firstElementChild;
  const links = $$('a', nav);
  const sections = links.map((a) => document.getElementById(a.hash.slice(1)));
  let current = -1, queued = false;
  const update = () => {
    queued = false;
    const line = innerHeight * 0.4;
    let next = -1;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) next = i; });
    if (next === current) return;
    current = next;
    links.forEach((a, i) => (i === next ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    const on = links[next];
    if (on) strip.scrollTo({ left: on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

/* Etapas: la imagen fija cambia según la etapa que se está leyendo */
const how = $('[data-phases]');
if (how) {
  const items = $$('[data-phase]', how);
  const shots = $$('.how__screen img', how);
  const meter = $$('.how__meter i', how);
  const number = $('[data-phase-n]', how);
  how.classList.add('is-live');
  const show = (n) => {
    items.forEach((x, i) => x.classList.toggle('is-on', i === n));
    shots.forEach((x, i) => x.classList.toggle('is-on', i === n));
    meter.forEach((x, i) => x.classList.toggle('is-on', i <= n));
    number.textContent = String(n + 1).padStart(2, '0');
  };
  let queued = false;
  const update = () => {
    queued = false;
    const line = innerHeight * 0.55;
    let n = 0;
    items.forEach((x, i) => { if (x.getBoundingClientRect().top <= line) n = i; });
    show(n);
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  update();
}

/* Equipamiento: pestañas accesibles (sin JavaScript se ven todas las fichas) */
const box = $('[data-gear]');
if (box) {
  const tabs = $$('[data-tab]', box);
  const panels = $$('[data-panel]', box);
  const list = $('.gear__tabs', box);
  list.setAttribute('role', 'tablist');
  const select = (n, focus) => {
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', i === n); tab.tabIndex = i === n ? 0 : -1; });
    panels.forEach((p, i) => { p.hidden = i !== n; });
    if (focus) tabs[n].focus({ preventScroll: true });
    if (list.scrollWidth > list.clientWidth) list.scrollTo({ left: tabs[n].offsetLeft - (list.clientWidth - tabs[n].offsetWidth) / 2, behavior: reduced ? 'auto' : 'smooth' });
    window.ScrollTrigger?.refresh();
  };
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      const to = step ? (i + step + tabs.length) % tabs.length : { Home: 0, End: tabs.length - 1 }[e.key];
      if (to == null) return;
      e.preventDefault();
      select(to, true);
    });
  });
  box.classList.add('is-tabs');
  select(0);
}
