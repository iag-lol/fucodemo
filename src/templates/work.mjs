import { layout } from './layout.mjs';
import { ctx, esc, img, src, icons, resolvedProjects, media } from './helpers.mjs';
import { card, pageHead, favBtn } from './components.mjs';
import { categories } from '../data/projects.mjs';
import { site } from '../data/site.mjs';

export function projectsPage(lang) {
  const c = ctx(lang);
  const { t, L, url } = c;
  const count = (k) => resolvedProjects.filter((p) => p.cats.includes(k)).length;
  const body = `
${pageHead(t('Portafolio', 'Portfolio'), t('Proyectos <em>seleccionados</em>', 'Selected <em>work</em>'), t('Filtra por categoría, busca por marca o cambia la vista. Pasa el cursor sobre un proyecto para ver el video.', 'Filter by category, search by brand or switch views. Hover a project to preview its video.'))}
<div class="filters wrap" data-filters>
  <div class="chips" role="group" aria-label="${t('Categorías', 'Categories')}">
    <button type="button" class="chip" data-cat="all" aria-pressed="true">${t('Todos', 'All')} <sup>${resolvedProjects.length}</sup></button>
    ${Object.entries(categories).map(([k, v]) => `<button type="button" class="chip" data-cat="${k}" aria-pressed="false">${L(v)} <sup>${count(k)}</sup></button>`).join('')}
  </div>
  <div class="filters__tools">
    <label class="switch"><input type="checkbox" data-only-video><i></i> ${t('Con video', 'With video')}</label>
    <label class="search">${icons.search}<input type="search" data-search-input placeholder="${t('Buscar marca o proyecto', 'Search brand or project')}" aria-label="${t('Buscar', 'Search')}"></label>
    <div class="views" role="group" aria-label="${t('Vista', 'View')}"><button type="button" data-view="grid" aria-pressed="true">${t('Grilla', 'Grid')}</button><button type="button" data-view="list" aria-pressed="false">${t('Lista', 'List')}</button></div>
  </div>
</div>
<section class="grid wrap" data-grid data-view="grid">
  ${resolvedProjects.map((p, i) => card(c, p, { n: i + 1 })).join('')}
</section>
<p class="empty wrap" data-empty hidden>${t('No hay proyectos con esos filtros.', 'No projects match those filters.')} <button type="button" class="link" data-reset>${t('Limpiar filtros', 'Clear filters')}</button></p>`;
  return layout(lang, { path: '/proyectos/', page: 'projects', title: t('Proyectos', 'Work'), body, scripts: ['projects'] });
}

export function projectPage(lang, p) {
  const c = ctx(lang);
  const { t, L, url } = c;
  const i = resolvedProjects.indexOf(p);
  const next = resolvedProjects[(i + 1) % resolvedProjects.length];
  const prev = resolvedProjects[(i - 1 + resolvedProjects.length) % resolvedProjects.length];
  const related = resolvedProjects.filter((q) => q !== p && q !== next && q.cats.some((k) => p.cats.includes(k))).slice(0, 3);
  const href = url(`/proyectos/${p.slug}/`);
  const gallery = p.photos.map((n, k) => {
    const m = media.images[n];
    return `<figure class="shot" data-reveal>
      <a href="${src(n, 2400)}" data-lightbox="g" data-thumb="${src(n, 480)}" data-caption="${esc(c.alt(p, k))}" data-cursor="Zoom">
        ${img(n, { sizes: '(max-width: 700px) 50vw, (max-width: 1200px) 33vw, 25vw', alt: c.alt(p, k), attrs: `style="aspect-ratio:${m.w}/${m.h};background:${m.color} url(${m.lqip}) center/cover"` }).replace(/ style="background:[^"]*"/, '')}
      </a>
      ${favBtn(c, { key: `i:${n}`, title: c.alt(p, k), thumb: src(n, 480), href })}
    </figure>`;
  }).join('');

  const body = `
<section class="phero">
  <div class="phero__media" style="view-transition-name:cover-${p.slug}">${img(p.cover, { eager: true, alt: c.alt(p) })}</div>
  <div class="phero__text wrap">
    <p class="eyebrow">${esc(p.client)}${p.year ? ` — ${p.year}` : ''}</p>
    <h1 class="display" data-split>${esc(p.title)}</h1>
    ${p.videos.length ? `<button type="button" class="btn btn--solid" data-play-video="${p.slug}:${p.videos[0].id}" data-magnetic>${icons.play} ${t('Reproducir video', 'Play video')}</button>` : ''}
  </div>
</section>
<section class="pmeta wrap">
  <p class="lead" data-reveal>${L(p.summary)}</p>
  <dl>
    <div><dt>${t('Marca', 'Client')}</dt><dd>${esc(p.client)}</dd></div>
    <div><dt>${t('Categoría', 'Category')}</dt><dd>${c.cats(p)}</dd></div>
    <div><dt>${t('Alcance', 'Scope')}</dt><dd>${L(p.scope).join('<br>')}</dd></div>
    <div class="pmeta__actions">${favBtn(c, { key: `p:${p.slug}`, title: `${p.title} — ${p.client}`, thumb: src(p.cover, 480), href })}
      <button type="button" class="btn btn--sm" data-share>${t('Compartir', 'Share')}</button>
      <a class="btn btn--sm btn--solid" href="${url(`/cotizar/?ref=${p.slug}`)}">${t('Quiero algo así', 'I want this')}</a></div>
  </dl>
</section>
${p.videos.length ? `<section class="pvideos wrap ${p.videos.length > 1 ? 'pvideos--duo' : ''}">
  <h2 class="sr">Video</h2>
  ${p.videos.map((v) => `<figure class="pvideo ${v.vertical ? 'pvideo--v' : ''}" data-reveal>
    <div class="player" data-player data-id="${p.slug}:${v.id}" data-sources='${JSON.stringify(v.sources)}' data-title="${esc(`${p.title} — ${L(v.label)}`)}" data-poster="${src(v.poster, 1600)}"></div>
    <figcaption>${L(v.label)}</figcaption></figure>`).join('')}
</section>` : `<p class="pnote wrap">${t('¿Quieres ver más de este proyecto?', 'Want to see more of this project?')} <a href="${site.instagram}" target="_blank" rel="noopener">${t('Míralo en nuestro Instagram', 'Check our Instagram')} ${icons.arrow}</a></p>`}
<section class="gallery wrap ${p.photos.length < 3 ? 'gallery--few' : ''}">
  <div class="shead"><p class="eyebrow">${p.photos.length} ${p.photos.length === 1 ? t('imagen', 'image') : t('imágenes', 'images')}</p><h2>${t('Galería', 'Gallery')}</h2></div>
  <div class="masonry">${gallery}</div>
</section>
${related.length ? `<section class="related wrap"><div class="shead"><h2>${t('También te puede', 'You may also')} <em>${t('interesar', 'like')}</em></h2></div>
  <div class="grid" data-view="grid">${related.map((q) => card(c, q, { transition: false })).join('')}</div></section>` : ''}
<nav class="pnav" aria-label="${t('Otros proyectos', 'Other projects')}">
  <a class="pnav__next" href="${url(`/proyectos/${next.slug}/`)}" data-cursor="${t('Siguiente', 'Next')}">
    ${img(next.cover, { sizes: '100vw' })}
    <span class="eyebrow">${t('Siguiente proyecto', 'Next project')}</span>
    <strong>${esc(next.title)}</strong><em>${esc(next.client)}</em>
  </a>
  <a class="pnav__prev" href="${url(`/proyectos/${prev.slug}/`)}">← ${t('Anterior', 'Previous')}: ${esc(prev.title)}</a>
</nav>`;

  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'CreativeWork', name: `${p.title} — ${p.client}`, description: L(p.summary), image: site.url + src(p.cover, 1600), url: site.url + href, creator: { '@type': 'Organization', name: site.name } },
  ];
  return layout(lang, { path: `/proyectos/${p.slug}/`, page: 'project', title: `${p.title} · ${p.client}`, description: L(p.summary), image: p.cover, body, jsonld });
}
