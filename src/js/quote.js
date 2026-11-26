// Cotizador por pasos con calendario de disponibilidad y resumen en vivo.
import { $, $$, el, t, lang, api, siteData, clamp, scroll } from './lib/util.js';
import { validate, showError, sendLead } from './lib/forms.js';
import { mood } from './lib/mood.js';

const root = $('[data-quote]');
const form = $('form', root);
const steps = $$('fieldset[data-step]', form);
const error = $('.form__error', form);
const [back, next, send] = ['[data-back]', '[data-next]', '[data-send]'].map((s) => $(s, form));
const DRAFT = 'fuco:quote';
let step = 0, reached = 0, date = '', blocked = new Set(), config = null, extraRef = null;

const inputs = (name) => $$(`input[name="${name}"]`, form);
const checked = (name) => inputs(name).filter((i) => i.checked);
const labels = (name) => checked(name).map((i) => i.dataset.label).join(', ');
const val = (name) => form.elements[name]?.value?.trim() ?? '';
const niceDate = (iso) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'es-CL', { dateStyle: 'long' }).format(new Date(`${iso}T12:00:00`));
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const references = () => [...(extraRef ? [extraRef] : []), ...mood.all().filter((m) => m.key !== extraRef?.key)];

/* Borrador: se conserva mientras la pestaña esté abierta */
function save() {
  const data = {};
  for (const i of form.elements) {
    if (!i.name || i.name === 'consent' || i.name === 'website') continue;
    if (i.type === 'checkbox' || i.type === 'radio') { if (i.checked) (data[i.name] ??= []).push(i.value); }
    else data[i.name] = i.value;
  }
  try { sessionStorage.setItem(DRAFT, JSON.stringify({ data, date })); } catch { /* sin almacenamiento */ }
}
function restore() {
  let draft;
  try { draft = JSON.parse(sessionStorage.getItem(DRAFT)); } catch { return; }
  if (!draft) return;
  date = draft.date || '';
  for (const i of form.elements) {
    const v = draft.data?.[i.name];
    if (v === undefined) continue;
    if (i.type === 'checkbox' || i.type === 'radio') i.checked = v.includes(i.value);
    else i.value = v;
  }
}

/* Calendario */
const calendar = $('[data-calendar]', form);
const today = new Date(); today.setHours(0, 0, 0, 0);
let month = new Date(today.getFullYear(), today.getMonth(), 1);
function renderCalendar() {
  const locale = lang === 'en' ? 'en-GB' : 'es-CL';
  const offset = (month.getDay() + 6) % 7;
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const diff = (month.getFullYear() - today.getFullYear()) * 12 + month.getMonth() - today.getMonth();
  const go = (n) => { month = new Date(month.getFullYear(), month.getMonth() + n, 1); renderCalendar(); };
  const names = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + i)).slice(0, 2));
  const cells = [...Array(offset)].map(() => el('span'));
  for (let d = 1; d <= days; d++) {
    const day = new Date(month.getFullYear(), month.getMonth(), d);
    const key = iso(day), busy = blocked.has(key);
    cells.push(el('button', {
      type: 'button', class: busy ? 'is-busy' : null, disabled: day < today || busy, 'aria-pressed': String(key === date),
      'aria-label': `${niceDate(key)}${busy ? ` — ${t('no disponible', 'unavailable')}` : ''}`,
      onclick: () => { date = date === key ? '' : key; form.elements.flexible.checked = false; renderCalendar(); update(); },
    }, String(d)));
  }
  calendar.replaceChildren(
    el('div', { class: 'cal__head' },
      el('button', { type: 'button', disabled: diff <= 0, 'aria-label': t('Mes anterior', 'Previous month'), onclick: () => go(-1) }, '←'),
      el('strong', { 'aria-live': 'polite' }, new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)),
      el('button', { type: 'button', disabled: diff >= 17, 'aria-label': t('Mes siguiente', 'Next month'), onclick: () => go(1) }, '→')),
    el('div', { class: 'cal__grid' }, names.map((n) => el('small', {}, n)), cells),
    el('p', { class: 'cal__legend' }, t('Las fechas tachadas no están disponibles. La reserva se confirma por correo.', 'Struck-through dates are unavailable. Bookings are confirmed by email.')));
}

/* Resumen tipo claqueta */
function estimate() {
  if (!config?.showPrices) return null;
  const r = config.rates;
  const base = checked('services').reduce((s, i) => s + (r.services?.[i.value] || 0), 0);
  if (!base) return null;
  const factor = r.duration?.[checked('duration')[0]?.value] || 1;
  return Math.round(base * factor + checked('deliverables').reduce((s, i) => s + (r.deliverables?.[i.value] || 0), 0));
}
function summaryRows() {
  return [
    [t('Servicios', 'Services'), labels('services')],
    [t('Formato', 'Format'), labels('format')],
    [t('Duración', 'Duration'), labels('duration')],
    [t('Entregables', 'Deliverables'), labels('deliverables')],
    [t('Lugar', 'Location'), val('location')],
    [t('Fecha', 'Date'), form.elements.flexible.checked ? t('Por definir', 'To be defined') : date ? niceDate(date) : ''],
    [t('Presupuesto', 'Budget'), labels('budget')],
  ];
}
function update() {
  $('[data-summary]', root).replaceChildren(...summaryRows().map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v || '—'))));
  const refs = references();
  $('[data-refs]', root).replaceChildren(...(refs.length ? [el('p', {}, `${t('Referencias', 'References')} (${refs.length})`), ...refs.slice(0, 8).map((m) => el('img', { src: m.thumb, alt: m.title, title: m.title }))] : []));
  const price = estimate(), box = $('[data-price]', root);
  box.hidden = price == null;
  if (price != null) box.replaceChildren(t('Estimado referencial desde', 'Indicative estimate from'), el('b', {}, `$${price.toLocaleString('es-CL')} CLP`), t('El valor final se confirma en la propuesta.', 'The final price is confirmed in the proposal.'));
  const text = [t('Hola FUCO, quiero cotizar un proyecto:', 'Hi FUCO, I would like a quote:'), ...summaryRows().filter(([, v]) => v).map(([k, v]) => `• ${k}: ${v}`), ...(val('name') ? [`• ${t('Nombre', 'Name')}: ${val('name')}`] : [])].join('\n');
  const wa = $('[data-wa]', root);
  wa.href = `${wa.href.split('?')[0]}?text=${encodeURIComponent(text)}`;
  save();
}

/* Pasos */
function problem(i) {
  if (i === 0 && !checked('services').length) return t('Elige al menos un servicio.', 'Pick at least one service.');
  if (i === 1 && !checked('format').length) return t('Elige el formato.', 'Pick a format.');
  if (i === 2 && !date && !form.elements.flexible.checked) return t('Elige una fecha o marca que aún no la tienes.', 'Pick a date or tick that you don’t have one yet.');
  return null;
}
function show(i, focus = true) {
  step = clamp(i, 0, steps.length - 1);
  reached = Math.max(reached, step);
  steps.forEach((f, n) => { f.hidden = n !== step; });
  $$('[data-goto]', form).forEach((b, n) => {
    n === step ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current');
    b.classList.toggle('is-done', n < step);
  });
  back.hidden = step === 0;
  next.hidden = step === steps.length - 1;
  send.hidden = !next.hidden;
  $('[data-take]', root).textContent = step + 1;
  showError(error);
  scroll.lenis?.resize();
  if (focus) {
    const top = root.getBoundingClientRect().top + scrollY - 100;
    if (scrollY > top) scroll.lenis ? scroll.lenis.scrollTo(top) : scrollTo({ top, behavior: 'smooth' });
  }
}
function advance(target) {
  for (let i = 0; i < target; i++) {
    const msg = problem(i);
    if (msg) { show(i); showError(error, msg); return false; }
  }
  show(target);
  return true;
}
next.addEventListener('click', () => advance(step + 1));
back.addEventListener('click', () => show(step - 1));
$$('[data-goto]', form).forEach((b) => b.addEventListener('click', () => { const i = Number(b.dataset.goto); if (i <= step) show(i); else if (i <= reached + 1) advance(i); }));
form.addEventListener('input', () => { showError(error); update(); });
form.addEventListener('change', (e) => {
  if (e.target.name === 'flexible' && e.target.checked) { date = ''; renderCalendar(); }
  update();
});
form.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT' && step < steps.length - 1) { e.preventDefault(); advance(step + 1); } });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (step < steps.length - 1) return advance(step + 1);
  for (let i = 0; i < 3; i++) if (problem(i)) return advance(i + 1);
  if (!validate(steps[step])) return showError(error, t('Revisa los campos marcados.', 'Check the highlighted fields.'));
  send.disabled = true;
  try {
    const price = estimate();
    const res = await sendLead({
      type: 'cotizacion', lang, consent: true,
      name: val('name'), email: val('email'), phone: val('phone'), company: val('company'), message: val('message'), website: form.elements.website.value,
      data: {
        services: labels('services'), format: labels('format'), duration: labels('duration'), deliverables: labels('deliverables'),
        location: val('location'), date: form.elements.flexible.checked ? '' : date, budget: labels('budget'),
        estimate: price ? `$${price.toLocaleString('es-CL')} CLP` : '', references: references().map((m) => `${m.title} (${m.href})`),
      },
    });
    try { sessionStorage.removeItem(DRAFT); } catch { /* sin almacenamiento */ }
    const done = $('[data-done]', root);
    form.hidden = $('.slate', root).hidden = true;
    done.hidden = false;
    $('[data-ref]', done).textContent = res.ref;
    $('[data-ref-email]', done).textContent = val('email');
    scroll.lenis?.resize();
    done.scrollIntoView({ block: 'center' });
  } catch (err) {
    showError(error, err.message);
  } finally {
    send.disabled = false;
  }
});

restore();
const params = new URLSearchParams(location.search);
const preset = inputs('services').find((i) => i.value === params.get('servicio'));
if (preset) preset.checked = true;
if (params.get('ref')) {
  const data = await siteData();
  const p = data.projects.find((x) => x.slug === params.get('ref'));
  if (p) extraRef = { key: `p:${p.slug}`, title: `${p.title} — ${p.client}`, thumb: p.thumb, href: p.url };
}
document.addEventListener('mood:change', update);
renderCalendar();
show(0, false);
update();
api('/api/availability').then((r) => {
  blocked = new Set(r.blocked);
  if (blocked.has(date)) date = '';
  renderCalendar(); update();
}).catch(() => {});
api('/api/config').then((r) => { config = r; update(); }).catch(() => {});
