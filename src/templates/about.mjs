import { layout } from './layout.mjs';
import { ctx, esc, img, icons, resolvedProjects, STATIC } from './helpers.mjs';
import { pageHead, timeline, marquee } from './components.mjs';
import { processSteps } from '../data/content.mjs';
import { crew, phases, gear, standards } from '../data/nosotros.mjs';
import { site } from '../data/site.mjs';

const ICONS = {
  disk: 'M4 5h16v6H4zM4 13h16v6H4zM7 8h.01M7 16h.01', plan: 'M5 4h14v16H5zM8 9h8M8 13h8M8 17h4',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l4 2', loop: 'M4 12a8 8 0 0 1 14-5l2 2M20 4v5h-5M20 12a8 8 0 0 1-14 5l-2-2M4 20v-5h5',
  license: 'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM8.5 14L7 21l5-3 5 3-1.500-7', permit: 'M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6zM8.500 12l2.500 2.500 4.500-5',
  lock: 'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3', gallery: 'M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M16 9h.01',
};
const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;

export function aboutPage(lang) {
  const c = ctx(lang);
  const { t, L, url } = c;
  const pend = (ok) => (ok ? '' : `<span class="pend">${t('Por confirmar', 'To be confirmed')}</span>`);
  const todo = (what) => `<span class="todo">${what} — ${t('por completar', 'to be added')}</span>`;
  const head = (eyebrow, a, b, text = '') => `<div class="shead"><p class="eyebrow">${eyebrow}</p><h2>${a} <em>${b}</em></h2>${text ? `<p>${text}</p>` : ''}</div>`;

  const chapters = [
    ['equipo', t('Equipo', 'Team')],
    ['como-trabajamos', t('Cómo trabajamos', 'How we work')],
    ['equipamiento', t('Equipamiento', 'Equipment')],
    ['profesionalidad', t('Profesionalidad', 'Standards')],
    ['edicion', t('Sala de edición', 'Edit suite')],
  ];
  const wall = ['ffl-f-01', 'bike-08', 'originals-f-04', 'terrex-10', 'canada-f-03', 'parade-f-05', 'mall-f-01', 'alaniz-f-02', 'ffl-02'];
  const stats = [
    [resolvedProjects.length, t('proyectos en portafolio', 'portfolio projects')],
    [new Set(resolvedProjects.map((p) => p.client)).size, t('marcas, eventos y talentos', 'brands, events and talent')],
    [resolvedProjects.reduce((n, p) => n + p.videos.length, 0), t('piezas de video para ver aquí', 'videos to watch here')],
    [resolvedProjects.reduce((n, p) => n + p.photos.length, 0), t('imágenes y fotogramas', 'images and frames')],
  ];
  const values = [
    [t('Estar donde pasa', 'Be where it happens'), t('Pasarela, pista, cerro o calle. La imagen se consigue en terreno.', 'Runway, dance floor, mountain or street. The image is won on location.')],
    [t('Color con intención', 'Colour with intent'), t('Cada proyecto tiene su propia paleta, coherente de la primera foto al último plano.', 'Every project gets its own palette, consistent from first photo to last shot.')],
    [t('Cada pantalla', 'Every screen'), t('Horizontal, vertical, galería o gigantografía: se piensa antes de filmar.', 'Landscape, vertical, gallery or billboard: planned before we shoot.')],
  ];

  const person = (m) => {
    const d = crew[m.email] ?? { ok: false, skills: [] };
    return `<article class="person" data-reveal data-tilt>
    ${d.photo ? `<div class="person__photo">${img(d.photo, { sizes: '(max-width: 900px) 100vw, 50vw', alt: m.name })}</div>` : `<div class="person__mark">${m.initials}</div>`}
    <h3>${m.name}</h3>
    <p class="person__role">${d.role ? esc(L(d.role)) : todo(t('Cargo', 'Role'))}</p>
    <p class="person__bio">${d.bio ? esc(L(d.bio)) : todo(t('Trayectoria y especialidad', 'Background and speciality'))}</p>
    ${d.skills?.length ? `<ul class="person__skills">${d.skills.map((s) => `<li class="chip">${esc(L(s))}</li>`).join('')}</ul>` : ''}
    <a href="mailto:${m.email}">${m.email}</a><a href="tel:${m.phone.replace(/\s/g, '')}">${m.phone}</a>
    <div class="person__actions"><a class="btn btn--sm" href="mailto:${m.email}">${t('Enviar correo', 'Send email')}</a><a class="btn btn--sm" href="https://wa.me/${m.phone.replace(/\D/g, '')}" target="_blank" rel="noopener">WhatsApp</a></div>
  </article>`;
  };

  const body = `
${pageHead(t('Nosotros', 'About us'), t('El equipo <em>detrás de cada plano</em>', 'The team <em>behind every frame</em>'), t('FUCO es un estudio de fotografía y video en Santiago de Chile. Trabajamos con marcas, eventos y talentos en moda, deporte, música y publicidad.', 'FUCO is a photography and video studio in Santiago, Chile. We work with brands, events and talent across fashion, sport, music and advertising.'))}
<section class="wall" data-wall>${[0, 1, 2].map((col) => `<div data-speed="${[-8, 10, -14][col]}">${wall.slice(col * 3, col * 3 + 3).map((n) => img(n, { sizes: '33vw', alt: 'FUCO Estudio' })).join('')}</div>`).join('')}</section>
<section class="stats wrap">${stats.map(([n, l]) => `<div data-reveal><strong data-counter="${n}">${n}</strong><span>${l}</span></div>`).join('')}</section>
<section class="values wrap">${values.map(([h, p], i) => `<article data-reveal><b>0${i + 1}</b><h2>${h}</h2><p>${p}</p></article>`).join('')}</section>

<div class="chapters">
<nav class="chapters__nav" aria-label="${t('Secciones de la página', 'Page sections')}" data-chapters><div>${chapters.map(([id, label]) => `<a class="chip" href="#${id}">${label}</a>`).join('')}</div></nav>

<section class="team wrap" id="equipo">
  ${head(t('Equipo', 'Team'), t('Quiénes', 'Who'), t('somos', 'we are'))}
  <div class="team__grid">${site.team.map(person).join('')}</div>
</section>

<section class="how wrap" id="como-trabajamos">
  ${head(t('Cómo trabajamos', 'How we work'), t('De la idea', 'From idea'), t('a la entrega', 'to delivery'), t('Cinco etapas, con lo que hacemos y lo que recibes en cada una.', 'Five stages, with what we do and what you get in each one.'))}
  <div class="how__grid" data-phases>
    <div class="how__stage" aria-hidden="true">
      <div class="how__screen">${phases.map((p, i) => img(p.image, { sizes: '(max-width: 900px) 1px, 45vw', cls: i ? '' : 'is-on' })).join('')}</div>
      <p><b data-phase-n>01</b><span>/ ${String(phases.length).padStart(2, '0')}</span></p>
      <div class="how__meter">${phases.map((_, i) => `<i${i ? '' : ' class="is-on"'}></i>`).join('')}</div>
    </div>
    <ol class="how__list">${phases.map((p, i) => `<li class="phase" data-phase="${i}">
      <div class="phase__img">${img(p.image, { sizes: '(max-width: 900px) 100vw, 1px' })}</div>
      <p class="phase__n">${String(i + 1).padStart(2, '0')} ${pend(p.ok)}</p>
      <h3>${L(p.title)}</h3><p class="phase__text">${L(p.text)}</p>
      <ul class="ticks">${L(p.does).map((x) => `<li>${x}</li>`).join('')}</ul>
      <p class="phase__gets"><small>${t('Qué recibes', 'What you get')}</small>${L(p.gets)}</p>
    </li>`).join('')}</ol>
  </div>
</section>

<section class="gear wrap" id="equipamiento">
  ${head(t('Equipamiento', 'Equipment'), t('Con qué', 'What we'), t('trabajamos', 'work with'))}
  <div class="gear__box" data-gear>
    <div class="gear__tabs" aria-label="${t('Tipos de equipamiento', 'Equipment types')}">${gear.map((g, i) => `<button type="button" class="gear__tab" id="tab-${g.id}" data-tab="${g.id}"><small>${String(i + 1).padStart(2, '0')}</small>${L(g.title)}</button>`).join('')}</div>
    <div class="gear__panels">${gear.map((g) => `<article class="gear__panel" id="panel-${g.id}" data-panel="${g.id}">
      <div class="gear__img">${img(g.image, { sizes: '(max-width: 900px) 100vw, 36vw', alt: L(g.title) })}<i></i></div>
      <div class="gear__info">
        <h3>${L(g.title)}</h3><p>${L(g.use)}</p>
        <ul>${g.items.length
    ? g.items.map((x) => `<li><b>${esc(x.name)}</b>${x.detail ? `<span>${esc(L(x.detail))}</span>` : ''}</li>`).join('')
    : [1, 2, 3].map(() => `<li class="is-empty"><b>${todo(t('Marca y modelo', 'Brand and model'))}</b></li>`).join('')}</ul>
      </div>
    </article>`).join('')}</div>
  </div>
</section>

<section class="std wrap" id="profesionalidad">
  ${head(t('Profesionalidad', 'Standards'), t('Cómo cuidamos', 'How we look after'), t('tu proyecto', 'your project'))}
  <div class="std__grid">${standards.filter((s) => !(STATIC && s.icon === 'gallery')).map((s) => `<article class="std__card" data-reveal data-tilt>${icon(s.icon)}<h3>${L(s.title)}</h3><p>${L(s.text)}</p>${pend(s.ok)}</article>`).join('')}</div>
  <div class="std__cta" data-reveal><p>${t('¿Necesitas saber algo más antes de contratarnos?', 'Need to know anything else before hiring us?')}</p>
    <a class="btn btn--solid" href="${url('/cotizar/')}">${t('Cotizar un proyecto', 'Get a quote')} ${icons.arrow}</a>
    <a class="btn" href="${url('/contacto/')}">${t('Preguntar', 'Ask us')}</a></div>
</section>

<div id="edicion">${timeline(c, processSteps, { eyebrow: t('Sala de edición', 'Edit suite'), title: t('Nuestro trabajo', 'Our work'), accent: t('en movimiento', 'in motion') })}</div>
</div>
${marquee(c)}`;
  return layout(lang, {
    path: '/nosotros/', page: 'about', title: t('Nosotros', 'About us'), image: 'ffl-01', scripts: ['home', 'about'], body,
    description: t('Quiénes somos en FUCO Estudio, cómo trabajamos, con qué equipamiento y cómo cuidamos cada proyecto de foto y video.', 'Who we are at FUCO Estudio, how we work, what equipment we use and how we look after every photo and video project.'),
  });
}
