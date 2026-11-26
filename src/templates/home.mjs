import { layout } from './layout.mjs';
import { ctx, esc, img, src, icons, videoSources, resolvedProjects, bySlug } from './helpers.mjs';
import { card, marquee, timeline, compare } from './components.mjs';
import { services, processSteps } from '../data/content.mjs';

export function home(lang) {
  const c = ctx(lang);
  const { t, L, url } = c;
  const hero = videoSources('hero');
  const featured = resolvedProjects.filter((p) => p.featured);
  const verticals = resolvedProjects.flatMap((p) => p.videos.filter((v) => v.vertical).map((v) => ({ p, v })));
  const stats = [
    [resolvedProjects.length, t('proyectos en portafolio', 'portfolio projects')],
    [new Set(resolvedProjects.map((p) => p.client)).size, t('marcas, eventos y talentos', 'brands, events and talent')],
    [resolvedProjects.reduce((n, p) => n + p.videos.length, 0), t('piezas de video para ver aquí', 'videos to watch here')],
    [resolvedProjects.reduce((n, p) => n + p.photos.length, 0), t('imágenes y fotogramas', 'images and frames')],
  ];
  // Imagen dentro de la frase: es un enlace al proyecto y abre una vista previa flotante (lib/peek.js).
  const pic = (name, slug, { video, start = 0 } = {}) => {
    const p = bySlug[slug];
    const v = p.videos.find((x) => x.id === video);
    const data = v ? ` data-video-sd="${v.sources['360p'] ?? v.sources['720p']}" data-video-hd="${v.sources['720p'] ?? v.sources['360p']}" data-start="${start}"` : '';
    return `<a class="inline-pic" href="${url(`/proyectos/${slug}/`)}" data-peek data-poster="${src(name, 960)}" data-client="${esc(p.client)}" data-title="${esc(p.title)}"${data} aria-label="${esc(`${t('Ver proyecto', 'View project')}: ${p.title} — ${p.client}`)}">${img(name, { sizes: '(max-width: 700px) 40vw, 200px' })}${v ? '<i aria-hidden="true"></i>' : ''}</a>`;
  };
  const runway = pic('ffl-07', 'falabella-fashion-live', { video: 'falabella-aftermovie', start: 16 });
  const andes = pic('terrex-05', 'adidas-fest-snow-edition', { video: 'adidas-fest-recap', start: 9 });
  const crowd = pic('mother-mother', 'mother-mother-chile');

  const body = `
<section class="hero" data-hero>
  <div class="hero__media" data-hero-media>
    <video class="hero__video" muted loop playsinline preload="metadata" poster="${src('originals-poster', 1600)}" data-sd="${hero['360p']}" data-md="${hero['720p']}" data-hd="${hero['1080p']}"></video>
  </div>
  <div class="hud" aria-hidden="true">
    <i class="hud__c hud__c--tl"></i><i class="hud__c hud__c--tr"></i><i class="hud__c hud__c--bl"></i><i class="hud__c hud__c--br"></i>
    <div class="hud__rec"><b></b>REC <span data-timecode>00:00:00:00</span></div>
    <div class="hud__spec">1080p · 24 FPS · 1/50 · ƒ/2.8 · ISO 400 · 5600K</div>
    <div class="hud__reticle" data-reticle><i></i></div>
    <div class="hud__meter" data-meter>${'<i></i>'.repeat(14)}</div>
  </div>
  <div class="hero__content wrap">
    <p class="eyebrow">${L({ es: 'Estudio de fotografía y video — Santiago, Chile', en: 'Photography & video studio — Santiago, Chile' })}</p>
    <h1 class="hero__title">
      <span class="line"><span>${t('Imágenes', 'Images')}</span></span>
      <span class="line"><span><em>${t('que se sienten', 'you can feel')}</em></span></span>
    </h1>
    <div class="hero__cta">
      <a class="btn btn--solid" href="${url('/proyectos/')}" data-magnetic>${t('Ver proyectos', 'View work')} ${icons.arrow}</a>
      <button class="btn" data-reel data-magnetic>${icons.play} ${t('Ver showreel', 'Watch showreel')}</button>
    </div>
  </div>
  <div class="hero__foot wrap">
    <a href="${url('/proyectos/adidas-originals/')}">${t('En pantalla', 'Now playing')}: <b>Adidas Originals</b></a>
    <button type="button" data-sound aria-pressed="false">${t('Sonido', 'Sound')}: <b>off</b></button>
    <span class="hero__scroll">${t('Desliza', 'Scroll')} <i></i></span>
  </div>
</section>

${marquee(c)}

<section class="manifesto wrap">
  <p class="eyebrow">FUCO Estudio</p>
  <p class="manifesto__text" data-words>${t(
    `Entramos a la pasarela <span class="nb">${runway},</span> subimos a la cordillera <span class="nb">${andes},</span> nos metemos entre el público ${crowd} y volvemos con imágenes que hacen que <em>quieras haber estado ahí.</em>`,
    `We step onto the runway <span class="nb">${runway},</span> climb the Andes <span class="nb">${andes},</span> dive into the crowd ${crowd} and come back with images that make you <em>wish you had been there.</em>`,
  )}</p>
</section>

<section class="featured" data-hscroll>
  <div class="featured__pin">
    <div class="shead wrap"><p class="eyebrow">${t('Selección', 'Selected work')}</p><h2>${t('Proyectos', 'Featured')} <em>${t('destacados', 'projects')}</em></h2>
      <a class="link" href="${url('/proyectos/')}">${t('Ver todos', 'View all')} (${resolvedProjects.length}) ${icons.arrow}</a></div>
    <div class="featured__track" data-track data-cursor="${t('Desliza', 'Scroll')}">
      ${featured.map((p, i) => card(c, p, { sizes: '(max-width: 900px) 85vw, 50vw', n: i + 1 })).join('')}
      <a class="featured__end" href="${url('/proyectos/')}"><span>${t('Todo el portafolio', 'Full portfolio')}</span>${icons.arrow}</a>
    </div>
    <div class="featured__progress wrap"><i data-progress></i></div>
  </div>
</section>

<section class="index wrap" data-index>
  <div class="shead"><p class="eyebrow">${t('Índice', 'Index')}</p><h2>${t('Más', 'More')} <em>${t('historias', 'stories')}</em></h2></div>
  <ul>${resolvedProjects.filter((p) => !p.featured).map((p, i) => `<li><a href="${url(`/proyectos/${p.slug}/`)}" data-preview="${src(p.cover, 960)}">
    <small>${String(i + featured.length + 1).padStart(2, '0')}</small>
    <img class="index__thumb" src="${src(p.cover, 480)}" alt="" loading="lazy">
    <strong>${esc(p.title)}</strong><em>${esc(p.client)}</em><span>${c.cats(p)}</span>${icons.arrow}</a></li>`).join('')}</ul>
  <canvas class="index__preview" data-preview-canvas width="640" height="800" aria-hidden="true"></canvas>
</section>

<section class="stack wrap">
  <div class="shead"><p class="eyebrow">${t('Servicios', 'Services')}</p><h2>${t('Lo que', 'What')} <em>${t('hacemos', 'we do')}</em></h2></div>
  ${services.map((s, i) => `<article class="stack__card" style="--i:${i}">
    <div class="stack__text"><b>${s.n}</b><h3>${L(s.title)}</h3><p>${L(s.text)}</p>
      <ul>${L(s.items).map((x) => `<li>${x}</li>`).join('')}</ul>
      <a class="link" href="${url(`/cotizar/?servicio=${s.id}`)}">${t('Cotizar este servicio', 'Quote this service')} ${icons.arrow}</a></div>
    <a class="stack__media" href="${url(`/servicios/#${s.id}`)}" data-cursor="${t('Ver', 'View')}">${img(s.image, { sizes: '(max-width: 800px) 100vw, 45vw', alt: L(s.title) })}</a>
  </article>`).join('')}
</section>

<section class="verticals">
  <div class="shead wrap"><p class="eyebrow">9:16</p><h2>${t('Pensado', 'Made')} <em>${t('en vertical', 'vertical')}</em></h2><p>${t('Toca un video para verlo con sonido.', 'Tap a video to watch it with sound.')}</p></div>
  <div class="verticals__row" data-drag data-cursor="${t('Arrastra', 'Drag')}">
    ${verticals.map(({ p, v }) => `<button type="button" class="phone" data-play-video="${p.slug}:${v.id}" data-cursor="Play">
      ${img(v.poster, { sizes: '300px', alt: c.alt(p) })}
      <video muted loop playsinline preload="none" data-auto-src="${v.sources['360p']}" aria-hidden="true"></video>
      <span><b>${esc(p.client)}</b>${esc(p.title)}</span>${icons.play}
    </button>`).join('')}
  </div>
</section>

<section class="colorsec wrap">
  <div class="shead"><p class="eyebrow">${t('Postproducción', 'Post-production')}</p><h2>${t('El color', 'Colour')} <em>${t('cuenta', 'tells it')}</em></h2>
    <p>${t('Arrastra para comparar. Es una demostración: el perfil plano está simulado en tu navegador.', 'Drag to compare. This is a demo: the flat profile is simulated in your browser.')}</p></div>
  ${compare(c, 'ffl-05')}
  <a class="btn" href="${url('/lab/')}" data-magnetic>${t('Probar el laboratorio de color', 'Try the colour lab')} ${icons.arrow}</a>
</section>

${timeline(c, processSteps)}

<section class="stats wrap">
  ${stats.map(([n, l]) => `<div data-reveal><strong data-counter="${n}">${n}</strong><span>${l}</span></div>`).join('')}
</section>

<section class="band" data-parallax-band>
  ${img('mother-mother', { sizes: '100vw', alt: c.alt(bySlug['mother-mother-chile']) })}
  <div class="band__text wrap"><h2>${t('Tu evento pasa una vez.', 'Your event happens once.')}<br><em>${t('Que se vea para siempre.', 'Make it last.')}</em></h2>
    <a class="btn btn--solid" href="${url('/cotizar/')}" data-magnetic>${t('Armar mi cotización', 'Build my quote')} ${icons.arrow}</a></div>
</section>`;

  return layout(lang, { path: '/', page: 'home', body, image: 'terrex-02', scripts: ['home'] });
}
