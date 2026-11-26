import { site } from '../data/site.mjs';
import { developer, websiteCredits } from '../data/developer.mjs';
import { ctx, esc, icons, src, STATIC } from './helpers.mjs';

export function layout(lang, { path, page, title, description, body, image, jsonld = [], noindex = false, scripts = [], footer = true }) {
  const c = ctx(lang);
  const { t, url, L } = c;
  const fullTitle = title ? `${title} — ${site.name}` : `${site.name} — ${L(site.tagline)} · Santiago`;
  const desc = description || L(site.description);
  const og = site.url + (image ? src(image, 1600) : '/media/brand/og.jpg');
  const nav = [
    ['/proyectos/', t('Proyectos', 'Work')],
    ['/servicios/', t('Servicios', 'Services')],
    ['/nosotros/', t('Nosotros', 'About')],
    ['/archivo/', t('Archivo', 'Archive')],
    ['/lab/', 'Lab'],
    ['/contacto/', t('Contacto', 'Contact')],
  ];
  const access = STATIC ? [] : [['/clientes/', t('Acceso clientes', 'Client access')]];
  const cur = (href) => (path.startsWith(href) ? ' aria-current="page"' : '');
  const otherLang = lang === 'es' ? `/en${path}` : path;
  const org = {
    '@context': 'https://schema.org', '@type': 'ProfessionalService', name: site.name, url: site.url,
    image: `${site.url}/media/brand/og.jpg`, logo: `${site.url}/media/brand/icon-512.png`, email: site.email,
    telephone: `+${site.whatsapp}`, sameAs: [site.instagram], description: L(site.description),
    address: { '@type': 'PostalAddress', addressLocality: 'Santiago', addressCountry: 'CL' },
  };

  return `<!doctype html>
<html lang="${lang}" class="no-js"${STATIC ? ' data-static' : ''}>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="generator" content="${esc(developer.name)} — desarrollo web">
${noindex ? '<meta name="robots" content="noindex,nofollow">' : `<link rel="canonical" href="${site.url}${url(path)}">
<link rel="alternate" hreflang="es" href="${site.url}${path}">
<link rel="alternate" hreflang="en" href="${site.url}/en${path}">
<link rel="alternate" hreflang="x-default" href="${site.url}${path}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${site.name}">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${og}">
<meta property="og:locale" content="${lang === 'es' ? 'es_CL' : 'en_US'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a0a0b">
<link rel="icon" href="/media/brand/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/media/brand/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="preload" href="/fonts/sans.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/serif-italic.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/css/main.css?v=__V__">
<script src="/js/boot.js?v=__V__"></script>
${[org, websiteCredits(site, lang), ...jsonld].map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`).join('\n')}
</head>
<body data-page="${page}">
<a class="skip" href="#main">${t('Saltar al contenido', 'Skip to content')}</a>
${page === 'home' ? `<div class="preloader" aria-hidden="true">
  <div class="preloader__iris">${Array.from({ length: 8 }, (_, i) => `<span style="--i:${i}"></span>`).join('')}</div>
  <div class="preloader__lens"></div>
  <img src="/media/brand/logo-fuco.png" alt="" width="90" height="90">
  <div class="preloader__count"><span data-count>000</span><small>${t('cargando', 'loading')}</small></div>
</div>` : ''}
<header class="hdr">
  <a class="brand" href="${url('/')}" aria-label="${site.name} — ${t('inicio', 'home')}">
    <img src="/media/brand/logo-fuco.png" alt="" width="34" height="34"><span>FUCO<em>Estudio</em></span>
  </a>
  <nav class="hdr__nav" aria-label="${t('Principal', 'Main')}">
    ${nav.map(([h, l]) => `<a href="${url(h)}"${cur(h)}><span data-text="${l}">${l}</span></a>`).join('')}
  </nav>
  <div class="hdr__tools">
    <button class="tool tool--reel" data-reel title="Showreel">${icons.play}<span>Reel</span></button>
    <button class="tool" data-palette aria-label="${t('Buscar (Ctrl K)', 'Search (Ctrl K)')}" title="⌘K / Ctrl K">${icons.search}</button>
    <button class="tool" data-mood aria-label="${t('Mi moodboard', 'My moodboard')}" title="Moodboard">${icons.heart}<b data-mood-count hidden>0</b></button>
    <a class="tool tool--lang" href="${otherLang}" hreflang="${lang === 'es' ? 'en' : 'es'}" lang="${lang === 'es' ? 'en' : 'es'}">${lang === 'es' ? 'EN' : 'ES'}</a>
    <a class="btn btn--sm btn--solid hdr__cta" href="${url('/cotizar/')}">${t('Cotizar', 'Get a quote')}</a>
    <button class="burger" aria-expanded="false" aria-controls="menu" aria-label="${t('Menú', 'Menu')}"><i></i><i></i></button>
  </div>
</header>
<div class="menu" id="menu" inert>
  <nav aria-label="${t('Menú móvil', 'Mobile menu')}">
    ${[...nav, ['/cotizar/', t('Cotizar', 'Get a quote')], ...access].map(([h, l], i) => `<a href="${url(h)}" style="--i:${i}"${cur(h)}><small>0${i + 1}</small>${l}</a>`).join('')}
  </nav>
  <p><a href="mailto:${site.email}">${site.email}</a> · <a href="${site.instagram}" target="_blank" rel="noopener">${site.instagramHandle}</a></p>
</div>
<main id="main">
${body}
</main>
${footer ? `<footer class="ftr">
  <div class="ftr__cta wrap">
    <p class="eyebrow">${t('¿Tienes una fecha en mente?', 'Got a date in mind?')}</p>
    <a class="ftr__big" href="${url('/cotizar/')}" data-cursor="${t('Vamos', 'Go')}"><span>${t('Hagámoslo', 'Let’s make it')}</span> <em>${t('realidad', 'happen')}</em>${icons.arrow}</a>
  </div>
  <div class="ftr__grid wrap">
    <div><h2>${t('Escríbenos', 'Write to us')}</h2>
      <a href="mailto:${site.email}">${site.email}</a>
      <button class="link" data-copy="${site.email}">${t('Copiar correo', 'Copy email')}</button>
      <a href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></div>
    ${site.team.map((m) => `<div><h2>${m.name}</h2><a href="mailto:${m.email}">${m.email}</a><a href="tel:${m.phone.replace(/\s/g, '')}">${m.phone}</a></div>`).join('')}
    <div><h2>${t('Explorar', 'Explore')}</h2>
      ${nav.slice(0, 5).map(([h, l]) => `<a href="${url(h)}">${l}</a>`).join('')}
      ${access.map(([h, l]) => `<a href="${url(h)}">${l}</a>`).join('')}</div>
  </div>
  <div class="ftr__word" aria-hidden="true">FUCO<em>Estudio</em></div>
  <div class="ftr__base wrap">
    <span>© ${new Date().getFullYear()} ${site.name}</span>
    <span>${site.city} — <time data-clock="${site.timezone}">--:--:--</time></span>
    <a href="${site.instagram}" target="_blank" rel="noopener">Instagram</a>
    <a href="${url('/privacidad/')}">${t('Privacidad', 'Privacy')}</a>
    <button class="link" data-top>${t('Volver arriba', 'Back to top')} ↑</button>
    <a class="ftr__credit" href="${developer.url}" target="_blank" rel="noopener">${t('Web desarrollada con', 'Website developed with')} <span role="img" aria-label="${t('amor', 'love')}">❤️</span> ${t('por', 'by')} <strong>${developer.name}</strong></a>
  </div>
</footer>` : ''}
<a class="wa" href="https://wa.me/${site.whatsapp}?text=${encodeURIComponent(t('Hola FUCO, quiero cotizar un proyecto.', 'Hi FUCO, I would like a quote for a project.'))}" target="_blank" rel="noopener" aria-label="WhatsApp">${icons.whatsapp}</a>
<div class="cursor" aria-hidden="true"><span></span></div>
<div class="toast" role="status" aria-live="polite"></div>
<script src="/vendor/gsap.min.js" defer></script>
<script src="/vendor/ScrollTrigger.min.js" defer></script>
<script src="/vendor/lenis.min.js" defer></script>
<script type="module" src="/js/core.js?v=__V__"></script>
${scripts.map((s) => `<script type="module" src="/js/${s}.js?v=__V__"></script>`).join('\n')}
</body>
</html>`;
}
