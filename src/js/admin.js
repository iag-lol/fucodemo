// Panel interno: solicitudes, galerías de clientes, disponibilidad y tarifas.
import { $, el, api, toast, copy } from './lib/util.js';

const root = $('#admin');
const STATUSES = ['nuevo', 'contactado', 'cotizado', 'ganado', 'descartado'];
const TYPES = { contacto: 'Contacto', cotizacion: 'Cotización', seleccion: 'Selección de fotos' };
const LABELS = { services: 'Servicios', format: 'Formato', duration: 'Duración', deliverables: 'Entregables', location: 'Lugar', date: 'Fecha', budget: 'Presupuesto', estimate: 'Estimado mostrado', references: 'Referencias', gallery: 'Galería', photos: 'Fotos elegidas' };
let state, tab = 'leads', filter = 'todos', query = '';
let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

const fail = (err) => { if (err.status === 401) return login(); toast(err.message); };
const run = (fn) => async (...args) => { try { await fn(...args); } catch (err) { fail(err); } };
const refresh = async () => { state = await api('/api/admin/state'); render(); };

function login() {
  const pass = el('input', { type: 'password', required: true, autocomplete: 'current-password', 'aria-label': 'Contraseña', placeholder: 'Contraseña' });
  const msg = el('p', { class: 'form__error', role: 'alert' });
  root.replaceChildren(el('form', {
    class: 'admin__login',
    onsubmit: async (e) => {
      e.preventDefault();
      try { await api('/api/admin/login', { method: 'POST', body: { password: pass.value } }); await refresh(); }
      catch (err) { msg.textContent = err.message; }
    },
  }, el('p', { class: 'eyebrow' }, 'FUCO Estudio'), el('h1', {}, 'Panel interno'), pass, el('button', { class: 'btn btn--solid' }, 'Entrar'), msg));
  pass.focus();
}

function leadsView() {
  const q = query.toLowerCase();
  const list = state.leads.filter((l) => (filter === 'todos' || l.status === filter) && JSON.stringify(l).toLowerCase().includes(q));
  const results = el('div', {});
  const card = (l) => {
    const rows = [['Referencia', l.ref], ['Email', l.email], ['Teléfono', l.phone], ['Empresa', l.company], ['Mensaje', l.message],
      ...Object.entries(l.data ?? {}).map(([k, v]) => [LABELS[k] ?? k, Array.isArray(v) ? v.join('\n') : v])].filter(([, v]) => v);
    const select = el('select', { 'aria-label': 'Estado', onchange: run(async () => { await api(`/api/admin/leads/${l.id}`, { method: 'PATCH', body: { status: select.value } }); await refresh(); toast('Estado actualizado'); }) },
      STATUSES.map((s) => el('option', { value: s, selected: s === l.status }, s)));
    return el('details', { class: 'lead-card' },
      el('summary', {}, el('span', { class: `tag tag--${l.status}` }, l.status), el('strong', {}, l.name), el('span', {}, `${TYPES[l.type] ?? l.type} · ${l.email || ''}`), el('time', {}, new Date(l.createdAt).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }))),
      el('div', { class: 'lead-card__body' }, el('dl', {}, rows.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, String(v))))),
        el('div', { class: 'admin__row' }, select,
          l.email ? el('a', { class: 'btn btn--sm', href: `mailto:${encodeURIComponent(l.email).replace('%40', '@')}?subject=${encodeURIComponent(`FUCO Estudio · ${l.ref}`)}` }, 'Responder por correo') : null,
          l.phone ? el('a', { class: 'btn btn--sm', target: '_blank', rel: 'noopener', href: `https://wa.me/${l.phone.replace(/\D/g, '')}` }, 'WhatsApp') : null,
          el('button', { type: 'button', class: 'btn btn--sm', onclick: run(async () => { if (!confirm(`¿Eliminar la solicitud de ${l.name}? No se puede deshacer.`)) return; await api(`/api/admin/leads/${l.id}`, { method: 'DELETE' }); await refresh(); }) }, 'Eliminar'))));
  };
  results.append(...(list.length ? list.map(card) : [el('p', {}, 'No hay solicitudes con ese filtro.')]));
  const search = el('input', { type: 'search', placeholder: 'Buscar…', value: query, 'aria-label': 'Buscar', oninput: () => { query = search.value; render(); const next = $('input[type="search"]', root); next.focus(); next.setSelectionRange(query.length, query.length); } });
  const status = el('select', { 'aria-label': 'Filtrar por estado', onchange: () => { filter = status.value; render(); } }, ['todos', ...STATUSES].map((s) => el('option', { value: s, selected: s === filter }, s)));
  return [
    el('div', { class: 'admin__stats' }, [['Total', state.leads.length], ['Nuevas', state.leads.filter((l) => l.status === 'nuevo').length], ['Cotizaciones', state.leads.filter((l) => l.type === 'cotizacion').length], ['Ganadas', state.leads.filter((l) => l.status === 'ganado').length]].map(([k, v]) => el('div', {}, el('b', {}, String(v)), el('span', {}, k)))),
    el('div', { class: 'admin__row' }, search, status, el('a', { class: 'btn btn--sm', href: '/api/admin/leads.csv', download: '' }, 'Exportar CSV')),
    results,
  ];
}

function galleriesView() {
  const title = el('input', { required: true, placeholder: 'Nombre de la galería', 'aria-label': 'Nombre de la galería', maxlength: '120' });
  const client = el('input', { placeholder: 'Cliente', 'aria-label': 'Cliente', maxlength: '120' });
  const expires = el('input', { type: 'date', 'aria-label': 'Vence el (opcional)', title: 'Vence el (opcional)' });
  const create = el('form', { class: 'admin__row', onsubmit: run(async (e) => { e.preventDefault(); await api('/api/admin/galleries', { method: 'POST', body: { title: title.value, client: client.value, expires: expires.value } }); await refresh(); toast('Galería creada. Ahora sube las fotos.'); }) },
    title, client, expires, el('button', { class: 'btn btn--sm btn--solid' }, 'Crear galería'));
  const cards = state.galleries.map((g) => {
    const link = `${location.origin}/clientes/?code=${g.code}`;
    const progress = el('span', {});
    const file = el('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, 'aria-label': 'Subir fotos', onchange: run(async () => {
      const files = [...file.files];
      let failed = 0;
      for (const [i, f] of files.entries()) {
        progress.textContent = `Subiendo ${i + 1} de ${files.length}…`;
        await api(`/api/admin/galleries/${g.code}/photos?name=${encodeURIComponent(f.name)}`, { method: 'PUT', raw: f }).catch((err) => { if (err.status === 401) throw err; failed++; });
      }
      await refresh(); toast(failed ? `${files.length - failed} subidas, ${failed} con error` : files.length === 1 ? '1 foto subida' : `${files.length} fotos subidas`);
    }) });
    return el('section', { class: 'gal-card' },
      el('h2', {}, `${g.title}${g.client ? ` — ${g.client}` : ''}`),
      el('div', { class: 'admin__row' }, el('code', {}, g.code), el('button', { type: 'button', class: 'btn btn--sm', onclick: () => copy(link, 'Enlace copiado') }, 'Copiar enlace'), el('a', { class: 'btn btn--sm', href: link, target: '_blank', rel: 'noopener' }, 'Abrir'), el('span', {}, `Fotos: ${g.photos.length} · Favoritas: ${g.favorites.length}${g.expires ? ` · Vence: ${g.expires}` : ''}`),
        el('button', { type: 'button', class: 'btn btn--sm', onclick: run(async () => { if (!confirm(`¿Eliminar la galería "${g.title}" y sus ${g.photos.length} fotos? No se puede deshacer.`)) return; await api(`/api/admin/galleries/${g.code}`, { method: 'DELETE' }); await refresh(); }) }, 'Eliminar galería')),
      g.comment ? el('p', {}, `Comentario del cliente: ${g.comment}`) : null,
      g.favorites.length ? el('p', {}, `Seleccionadas: ${g.photos.filter((p) => g.favorites.includes(p.id)).map((p) => p.name).join(', ')}`) : null,
      el('div', { class: 'admin__row' }, file, progress),
      el('div', { class: 'gal-card__thumbs' }, g.photos.map((p) => el('figure', { class: g.favorites.includes(p.id) ? 'is-fav' : null }, el('img', { src: `/api/gallery/${g.code}/photo/${p.id}?size=thumb`, alt: p.name, title: p.name, loading: 'lazy' }),
        el('button', { type: 'button', 'aria-label': `Eliminar ${p.name}`, onclick: run(async () => { if (!confirm(`¿Eliminar ${p.name}?`)) return; await api(`/api/admin/galleries/${g.code}/photos/${p.id}`, { method: 'DELETE' }); await refresh(); }) }, '×')))));
  });
  return [create, ...(cards.length ? cards : [el('p', {}, 'Aún no hay galerías.')])];
}

function availabilityView() {
  const blocked = new Set(state.blocked);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const go = (n) => { month = new Date(month.getFullYear(), month.getMonth() + n, 1); render(); };
  const cells = [...Array((month.getDay() + 6) % 7)].map(() => el('span'));
  for (let d = 1; d <= days; d++) {
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(el('button', { type: 'button', 'aria-pressed': String(blocked.has(key)), 'aria-label': `${key} ${blocked.has(key) ? 'bloqueado' : 'disponible'}`, onclick: run(async () => {
      blocked.has(key) ? blocked.delete(key) : blocked.add(key);
      await api('/api/admin/availability', { method: 'PUT', body: { blocked: [...blocked] } });
      await refresh();
    }) }, String(d)));
  }
  return [el('p', {}, 'Haz clic en un día para bloquearlo o liberarlo. Los días marcados en rojo no se pueden elegir en el cotizador.'),
    el('div', { class: 'cal admin__panel' }, el('div', { class: 'cal__head' }, el('button', { type: 'button', onclick: () => go(-1), 'aria-label': 'Mes anterior' }, '←'), el('strong', {}, month.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })), el('button', { type: 'button', onclick: () => go(1), 'aria-label': 'Mes siguiente' }, '→')),
      el('div', { class: 'cal__grid' }, ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do'].map((n) => el('small', {}, n)), cells))];
}

function ratesView() {
  const { config, options } = state;
  const fields = [];
  const group = (title, key, list, step, hint) => [el('h2', { class: 'admin__panel' }, title), el('p', {}, hint), el('table', {}, el('tbody', {}, list.map((o) => {
    const input = el('input', { type: 'number', min: '0', step, value: config.rates[key]?.[o.id] ?? '', 'aria-label': o.label });
    fields.push({ key, id: o.id, input });
    return el('tr', {}, el('td', {}, o.label), el('td', {}, input));
  })))];
  const show = el('input', { type: 'checkbox', checked: config.showPrices });
  return [el('form', { onsubmit: run(async (e) => {
    e.preventDefault();
    const rates = { services: {}, duration: {}, deliverables: {} };
    for (const f of fields) if (f.input.value !== '') rates[f.key][f.id] = Number(f.input.value);
    await api('/api/admin/config', { method: 'PUT', body: { showPrices: show.checked, rates } });
    await refresh(); toast('Tarifas guardadas');
  }) },
    el('label', { class: 'check' }, show, el('span', {}, 'Mostrar estimado de precio en el cotizador (desactivado mientras no definas tus valores).')),
    group('Valor base por servicio (CLP)', 'services', options.services, '1000', 'Valor de una jornada completa.'),
    group('Multiplicador por duración', 'duration', options.duration, '0.05', 'Ejemplo: media jornada 0.6, jornada completa 1, varios días 2.'),
    group('Adicional por entregable (CLP)', 'deliverables', options.deliverables, '1000', 'Se suma al total.'),
    el('p', { class: 'admin__panel' }, el('button', { class: 'btn btn--solid' }, 'Guardar tarifas')))];
}

function render() {
  const tabs = [['leads', 'Solicitudes'], ['galleries', 'Galerías'], ['availability', 'Disponibilidad'], ['rates', 'Tarifas']];
  const views = { leads: leadsView, galleries: galleriesView, availability: availabilityView, rates: ratesView };
  root.replaceChildren(
    el('div', { class: 'admin__top' }, el('h1', {}, 'Panel FUCO'), el('div', { class: 'chips' }, tabs.map(([k, label]) => el('button', { type: 'button', class: 'chip', 'aria-pressed': String(k === tab), onclick: () => { tab = k; render(); } }, label))),
      el('div', { class: 'admin__row' }, el('a', { class: 'link', href: '/' }, 'Ver sitio'), el('button', { type: 'button', class: 'btn btn--sm', onclick: run(refresh) }, 'Actualizar'), el('button', { type: 'button', class: 'btn btn--sm', onclick: run(async () => { await api('/api/admin/logout', { method: 'POST' }); login(); }) }, 'Salir'))),
    ...views[tab]());
}

refresh().catch((err) => (err.status === 401 ? login() : root.replaceChildren(el('p', {}, 'El panel necesita el servidor (npm start).'))));
