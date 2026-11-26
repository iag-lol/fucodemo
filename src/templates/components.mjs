import { esc, img, src, icons, media, bySlug } from './helpers.mjs';
import { site } from '../data/site.mjs';
import { brands } from '../data/brands.mjs';
import { readFileSync } from 'node:fs';

const waveforms = JSON.parse(readFileSync(new URL('../data/timeline.json', import.meta.url)));

export const favBtn = (c, { key, title, thumb, href }) =>
  `<button class="fav" type="button" aria-pressed="false" aria-label="${c.t('Guardar en moodboard', 'Save to moodboard')}: ${esc(title)}" data-fav="${esc(JSON.stringify({ key, title, thumb, href }))}">${icons.heart}</button>`;

export function card(c, p, { sizes = '(max-width: 700px) 100vw, 33vw', transition = true, n } = {}) {
  const v = p.videos[0];
  const href = c.url(`/proyectos/${p.slug}/`);
  return `<article class="card" data-card data-cats="${p.cats.join(' ')}" data-video="${p.videos.length ? 1 : 0}" data-search="${esc(`${p.title} ${p.client} ${c.cats(p)}`.toLowerCase())}">
  <a class="card__link" href="${href}" data-cursor="${c.t('Ver', 'View')}">
    <div class="card__media" ${transition ? `style="view-transition-name:cover-${p.slug}"` : ''}>
      ${img(p.cover, { sizes, alt: c.alt(p) })}
      ${v ? `<video class="card__video" muted loop playsinline preload="none" data-hover-src="${v.sources['360p'] ?? v.sources['720p']}" aria-hidden="true"></video>
      <span class="card__badge">${icons.play} Video</span>` : ''}
    </div>
    <div class="card__info">${n != null ? `<small>${String(n).padStart(2, '0')}</small>` : ''}<h3>${esc(p.title)}</h3><p><b>${esc(p.client)}</b> — ${c.cats(p)}</p></div>
  </a>
  ${favBtn(c, { key: `p:${p.slug}`, title: `${p.title} — ${p.client}`, thumb: src(p.cover, 480), href })}
</article>`;
}

export const pageHead = (eyebrow, title, intro = '') => `<header class="phead wrap">
  <p class="eyebrow">${eyebrow}</p>
  <h1 class="display" data-split>${title}</h1>
  ${intro ? `<p class="lead" data-reveal>${intro}</p>` : ''}
</header>`;

export function marquee(c) {
  // Tamaño óptico: cada logo ocupa un área visual parecida, sea ancho o cuadrado.
  const item = (b) => {
    const info = media.brands[b.id];
    const ratio = info.w / info.h;
    const h = Math.min(84, Math.max(24, Math.sqrt(6200 / ratio))) * (b.scale ?? 1);
    return `<li style="--h:${h.toFixed(1)};--r:${ratio.toFixed(3)}"><img src="/media/brand/logos/${b.id}.png" alt="${esc(b.name)}" width="${info.w}" height="${info.h}" loading="lazy" decoding="async"></li>`;
  };
  const list = brands.filter((b) => media.brands[b.id]);
  const half = Math.ceil(list.length / 2);
  const row = (items, reverse) => {
    const html = items.map(item).join('').repeat(2);
    return `<div class="marquee__row${reverse ? ' marquee__row--rev' : ''}"><ul>${html.replace(/alt="[^"]*"/g, (m, i) => (i < html.length / 2 ? m : 'alt=""'))}</ul><ul aria-hidden="true">${html.replace(/alt="[^"]*"/g, 'alt=""')}</ul></div>`;
  };
  return `<section class="marquee" aria-label="${c.t('Marcas', 'Brands')}">
  <p class="eyebrow wrap">${c.t('Marcas y proyectos que hemos registrado', 'Brands and projects we have captured')}</p>
  ${row(list.slice(0, half))}
  ${row(list.slice(half), true)}
</section>`;
}

const TIMELINE_CLIPS = [['adidas-originals', 'hero'], ['falabella-fashion-live', 'falabella-aftermovie'], ['adidas-fest-snow-edition', 'adidas-fest-recap'], ['festibike-cenco-malls', 'cenco-bike'], ['paris-parade', 'paris-parade']];

/** Sala de edición: los videos horizontales se reproducen sincronizados con el scroll y la línea de tiempo. */
export function timeline(c, steps, head = {}) {
  const { t, L, url } = c;
  const clips = TIMELINE_CLIPS.map(([slug, id]) => {
    const p = bySlug[slug];
    const v = p?.videos.find((x) => x.id === id);
    const data = waveforms.clips[id];
    if (!v || !data) return null;
    return {
      id, title: p.title, client: p.client, label: L(v.label), url: url(`/proyectos/${slug}/`), duration: data.duration, peaks: data.peaks,
      sources: v.sources, poster: `/media/timeline/${id}-0.webp`, frames: Array.from({ length: 8 }, (_, k) => `/media/timeline/${id}-${k}.webp`),
    };
  }).filter(Boolean);
  const total = clips.reduce((n, x) => n + x.duration, 0);
  const btn = (action, label, path, extra = '') => `<button type="button" class="tl__btn" data-tl="${action}" aria-label="${label}" title="${label}" ${extra}><svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg></button>`;
  return `<section class="tl" data-timeline>
  <script type="application/json" data-tl-data>${JSON.stringify({ rate: waveforms.rate, clips }).replace(/</g, '\\u003c')}</script>
  <div class="tl__stage">
    <header class="tl__head wrap">
      <div><p class="eyebrow">${head.eyebrow ?? t('Proceso', 'Process')}</p><h2>${head.title ?? t('Del brief', 'From brief')} <em>${head.accent ?? t('al corte final', 'to final cut')}</em></h2></div>
      <p class="tl__hint">${t('Desliza para recorrer la línea de tiempo', 'Scroll to move through the timeline')} <i></i></p>
    </header>
    <div class="tl__editor wrap">
      <div class="tl__monitor" data-monitor tabindex="0" role="group" aria-label="${t('Monitor de video', 'Video monitor')}">
        <div class="tl__screen" data-screen>
          ${clips.map((x, i) => `<video muted playsinline preload="none" poster="${x.poster}"${i === 0 ? ' class="is-on"' : ''} aria-label="${esc(`${x.title} — ${x.client}`)}"></video>`).join('')}
          <span class="tl__tag"><b></b>${t('Programa', 'Program')}</span>
          <span class="tl__count" data-tl-count>01 / ${String(clips.length).padStart(2, '0')}</span>
          <div class="tl__lower" data-tl-lower><small data-tl-client>${esc(clips[0].client)}</small><strong data-tl-title>${esc(clips[0].title)}</strong></div>
          <button type="button" class="tl__unmute" data-tl="sound"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/></svg><span>${t('Activar sonido', 'Turn sound on')}</span></button>
        </div>
        <div class="tl__transport">
          ${btn('prev', t('Clip anterior', 'Previous clip'), '<path class="fill" d="M6 5h2v14H6zM20 5v14L9 12z"/>')}
          ${btn('play', t('Reproducir o pausar', 'Play or pause'), '<path class="fill i-play" d="M7 4.5v15l13-7.5z"/><path class="fill i-pause" d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>')}
          ${btn('next', t('Clip siguiente', 'Next clip'), '<path class="fill" d="M16 5h2v14h-2zM4 5v14l11-7z"/>')}
          <span class="tl__tc"><b data-tl-tc>00:00:00:00</b><small data-tl-total></small></span>
          <span class="tl__vu" aria-hidden="true">${'<i></i>'.repeat(2).replace(/<i><\/i>/g, `<i>${'<u></u>'.repeat(18)}</i>`)}</span>
          <a class="tl__link" data-tl-link href="${clips[0].url}">${t('Ver proyecto', 'View project')} ${icons.arrow}</a>
          ${btn('sound', t('Sonido', 'Sound'), '<path d="M4 9v6h4l5 4V5L8 9z"/><path class="i-on" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"/><path class="i-off" d="M16 9l6 6M22 9l-6 6"/>', 'aria-pressed="false"')}
          ${btn('full', t('Pantalla completa', 'Fullscreen'), '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>')}
        </div>
      </div>
      <aside class="tl__side">
        <ol class="steps">${steps.map((s, i) => `<li data-step-panel="${i}"${i === 0 ? ' class="is-on"' : ''}><b>0${i + 1}</b><h3>${L(s.t)}</h3><p>${L(s.d)}</p></li>`).join('')}</ol>
        <ul class="tl__bin" aria-label="${t('Clips', 'Clips')}">${clips.map((x, i) => `<li><button type="button" data-clip="${i}"><img src="${x.poster}" alt="" loading="lazy" width="256" height="144"><span><b>${esc(x.title)}</b><small>${esc(x.label)} · ${Math.floor(x.duration / 60)}:${String(Math.round(x.duration % 60)).padStart(2, '0')}</small></span></button></li>`).join('')}</ul>
      </aside>
      <div class="nle" data-nle>
        <div class="nle__track nle__track--ruler"><label>TC</label><div data-ruler></div></div>
        <div class="nle__track nle__track--steps"><label>V2</label><div>${steps.map((s, i) => `<button type="button" class="nle__clip" data-step="${i}"><span>${L(s.t)}</span></button>`).join('')}</div></div>
        <div class="nle__track nle__track--film" data-scrub><label>V1</label><div>${clips.map((x, i) => `<div class="nle__video" data-block="${i}" style="flex-grow:${(x.duration / total * 100).toFixed(3)}"><span>${esc(x.title)}</span></div>`).join('')}</div></div>
        <div class="nle__track nle__track--wave" data-scrub><label>A1</label><div data-wave><canvas data-wave-dim></canvas><div data-wave-clip><canvas data-wave-lit></canvas></div></div></div>
        <div class="nle__playhead" data-playhead role="slider" tabindex="0" aria-label="${t('Posición en la línea de tiempo', 'Timeline position')}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div>
      </div>
    </div>
  </div>
</section>`;
}

export function compare(c, name) {
  return `<div class="compare" data-compare style="--pos:50%">
  ${img(name, { sizes: '(max-width: 900px) 100vw, 70vw', cls: 'compare__after', alt: c.t('Fotografía con color final', 'Photo with final colour') })}
  <div class="compare__before">${img(name, { sizes: '(max-width: 900px) 100vw, 70vw' })}</div>
  <span class="compare__tag compare__tag--l">${c.t('Plano (simulado)', 'Flat (simulated)')}</span>
  <span class="compare__tag compare__tag--r">${c.t('Color final', 'Final grade')}</span>
  <i class="compare__line" aria-hidden="true"><b>⟷</b></i>
  <input type="range" min="0" max="100" value="50" aria-label="${c.t('Comparar antes y después', 'Compare before and after')}">
</div>`;
}

/** Cierre de los formularios en el sitio estático: el visitante envía el mensaje desde su WhatsApp o correo. */
export function handOffDone({ t }) {
  return `<div class="form__done" data-done hidden><i>↗</i><h2>${t('Falta un paso', 'One more step')}</h2>
  <p>${t('Preparamos tu mensaje. Envíalo desde WhatsApp o desde tu correo para que nos llegue.', 'Your message is ready. Send it from WhatsApp or your email so it reaches us.')}</p>
  <div class="form__send"><a class="btn btn--solid" data-send-wa href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">${icons.whatsapp} ${t('Abrir WhatsApp', 'Open WhatsApp')}</a>
  <a class="btn" data-send-mail href="mailto:${site.email}">${t('Enviar por correo', 'Send by email')}</a></div>
  <button type="button" class="link" data-edit>${t('Volver al formulario', 'Back to the form')}</button></div>`;
}
