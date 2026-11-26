// Genera el sitio estático en dist/ a partir de src/.
import { cpSync, existsSync, linkSync, copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const DIST = join(ROOT, 'dist');
const p = (...a) => join(ROOT, ...a);
const out = (file, content) => { const f = join(DIST, file); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, /\.(html|css|json)$/.test(file) ? rebase(content) : content); };

// Direcciones del sitio anterior
const REDIRECTS = [['/about', '/nosotros/'], ['/estudio/', '/nosotros/'], ['/en/estudio/', '/en/nosotros/'], ['/clients', '/proyectos/'], ['/contact', '/contacto/']];

if (!existsSync(p('src/data/media.json')) || !existsSync(p('public/media/img'))) {
  console.error('Falta el material optimizado. Ejecuta primero: npm run assets');
  process.exit(1);
}

const { home } = await import('../src/templates/home.mjs');
const { projectsPage, projectPage } = await import('../src/templates/work.mjs');
const { servicesPage, contactPage, privacyPage, notFoundPage } = await import('../src/templates/pages.mjs');
const { aboutPage } = await import('../src/templates/about.mjs');
const { pendingCount } = await import('../src/data/nosotros.mjs');
const { archivePage, labPage, quotePage, clientPage, adminPage } = await import('../src/templates/tools.mjs');
const { resolvedProjects, ctx, src, media, BASE, STATIC } = await import('../src/templates/helpers.mjs');

// En una subcarpeta (BASE_PATH) las rutas que empiezan en «/» se anteponen con ella.
const ROOTS = 'media|data|css|js|vendor|fonts|en|proyectos|servicios|nosotros|archivo|lab|cotizar|contacto|privacidad|clientes|404|manifest\\.webmanifest';
function rebase(text) {
  if (!BASE) return text;
  return String(text)
    .replace(new RegExp(`(["'(]|, |&quot;)/(?=(?:${ROOTS})(?:[/?#"')]|$))`, 'g'), `$1${BASE}/`)
    .replace(/((?:href|content)=")\/(?=["?#])/g, `$1${BASE}/`); // enlaces a la portada
}
const { categories } = await import('../src/data/projects.mjs');
const { services } = await import('../src/data/content.mjs');
const { site } = await import('../src/data/site.mjs');

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// Estáticos (los videos se enlazan para no duplicar espacio en disco)
cpSync(p('public'), DIST, { recursive: true, filter: (s) => !s.endsWith('.mp4') });
mkdirSync(join(DIST, 'media/video'), { recursive: true });
for (const f of readdirSync(p('public/media/video'))) {
  const from = p('public/media/video', f), to = join(DIST, 'media/video', f);
  try { linkSync(from, to); } catch { copyFileSync(from, to); }
}

const vendor = {
  'gsap.min.js': 'gsap/dist/gsap.min.js',
  'ScrollTrigger.min.js': 'gsap/dist/ScrollTrigger.min.js',
  'lenis.min.js': 'lenis/dist/lenis.min.js',
};
const fonts = {
  'sans.woff2': '@fontsource-variable/work-sans/files/work-sans-latin-wght-normal.woff2',
  'serif.woff2': '@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-wght-normal.woff2',
  'serif-italic.woff2': '@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-wght-italic.woff2',
  'mono.woff2': '@fontsource/space-mono/files/space-mono-latin-400-normal.woff2',
};
for (const [dir, map] of [['vendor', vendor], ['fonts', fonts]]) {
  mkdirSync(join(DIST, dir), { recursive: true });
  for (const [name, from] of Object.entries(map)) copyFileSync(p('node_modules', from), join(DIST, dir, name));
}

const css = readdirSync(p('src/css')).filter((f) => f.endsWith('.css')).sort().map((f) => readFileSync(p('src/css', f), 'utf8')).join('\n');
out('css/main.css', css);
cpSync(p('src/js'), join(DIST, 'js'), { recursive: true });

const hash = createHash('sha1').update(css);
for (const f of readdirSync(p('src/js'), { recursive: true }).sort()) if (f.endsWith('.js')) hash.update(readFileSync(p('src/js', f)));
const VERSION = hash.digest('hex').slice(0, 8);
const page = (file, html) => out(file, html.replaceAll('__V__', VERSION));

const paths = [];
for (const lang of ['es', 'en']) {
  const base = lang === 'en' ? 'en/' : '';
  const add = (path, html) => { page(`${base}${path}index.html`, html); };
  const list = [
    ['', home(lang)], ['proyectos/', projectsPage(lang)], ['servicios/', servicesPage(lang)], ['nosotros/', aboutPage(lang)],
    ['archivo/', archivePage(lang)], ['lab/', labPage(lang)], ['cotizar/', quotePage(lang)], ['contacto/', contactPage(lang)],
    ['privacidad/', privacyPage(lang)], ...resolvedProjects.map((pr) => [`proyectos/${pr.slug}/`, projectPage(lang, pr)]),
  ];
  for (const [path, html] of list) { add(path, html); paths.push(`/${base}${path}`); }
  if (!STATIC) add('clientes/', clientPage(lang));
  page(`${base}404.html`, notFoundPage(lang));

  // Datos para el buscador, showreel, archivo y cotizador
  const c = ctx(lang);
  const data = {
    projects: resolvedProjects.map((pr) => ({
      slug: pr.slug, title: pr.title, client: pr.client, cats: pr.cats, catLabel: c.cats(pr), url: c.url(`/proyectos/${pr.slug}/`), thumb: src(pr.cover, 480),
      videos: pr.videos.map((v) => ({ id: `${pr.slug}:${v.id}`, label: c.L(v.label), vertical: !!v.vertical, sources: v.sources, poster: src(v.poster, 960) })),
      photos: pr.photos.map((n) => ({ key: `i:${n}`, w: media.images[n].w, h: media.images[n].h, color: media.images[n].color, thumb: src(n, 480), full: src(n, 2400) })),
    })),
    categories: Object.fromEntries(Object.entries(categories).map(([k, v]) => [k, c.L(v)])),
    services: services.map((s) => ({ id: s.id, title: c.L(s.title) })),
    contact: { email: site.email, whatsapp: site.whatsapp, instagram: site.instagram },
  };
  out(`data/site.${lang}.json`, JSON.stringify(data));
}
if (!STATIC) page('admin/index.html', adminPage());

out('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((u) => `<url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
out('robots.txt', `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nSitemap: ${site.url}/sitemap.xml\n`);
out('manifest.webmanifest', JSON.stringify({
  name: site.name, short_name: site.short, start_url: `${BASE}/`, display: 'standalone', background_color: '#0a0a0b', theme_color: '#0a0a0b', lang: 'es-CL',
  icons: [192, 512].map((s) => ({ src: `${BASE}/media/brand/icon-${s}.png`, sizes: `${s}x${s}`, type: 'image/png' })),
}));
page('sw.js', readFileSync(p('src/sw.js'), 'utf8'));
// Redirecciones desde las direcciones del sitio anterior (formato Netlify/Cloudflare Pages)
out('_redirects', REDIRECTS.map(([from, to]) => `${from} ${to} 301\n`).join(''));
// Sin servidor propio, cada dirección antigua es una página que salta a la nueva.
if (STATIC) {
  for (const [from, to] of REDIRECTS) {
    out(`${from.replace(/^\/|\/$/g, '')}/index.html`, `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${BASE}${to}"><title>FUCO Estudio</title><a href="${to}">${site.url}${to}</a></html>\n`);
  }
  out('.nojekyll', '');
}

console.log(`Sitio generado en dist/ — ${paths.length} páginas públicas (versión ${VERSION})${STATIC ? ` · modo estático${BASE ? ` en ${BASE}/` : ''}` : ''}`);
if (pendingCount()) console.log(`Aviso: la página «Nosotros» tiene ${pendingCount()} datos por confirmar o completar (src/data/nosotros.mjs).`);
