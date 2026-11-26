import { readFileSync } from 'node:fs';
import { projects, categories } from '../data/projects.mjs';

export const media = JSON.parse(readFileSync(new URL('../data/media.json', import.meta.url)));

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const src = (name, width = 960) => {
  const m = media.images[name];
  if (!m) throw new Error(`Imagen desconocida: ${name}`);
  const w = m.widths.find((x) => x >= width) ?? m.widths.at(-1);
  return `/media/img/${name}-${w}.webp`;
};
export const srcset = (name) => media.images[name].widths.map((w) => `/media/img/${name}-${w}.webp ${w}w`).join(', ');

export function img(name, { sizes = '100vw', cls = '', alt = '', eager = false, attrs = '' } = {}) {
  const m = media.images[name];
  if (!m) throw new Error(`Imagen desconocida: ${name}`);
  return `<img class="${cls}" src="${src(name, 960)}" srcset="${srcset(name)}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" style="background:${m.color} url(${m.lqip}) center/cover" ${attrs}>`;
}

export const videoSources = (id) => {
  const q = media.videos[id];
  if (!q) return null;
  return Object.fromEntries(['360p', '720p', '1080p'].filter((k) => q[k] != null).map((k) => [k, `/media/video/${id}-${k}.mp4`]));
};

/** Proyectos con sus videos resueltos (incluye los agregados en video-extra). */
export const resolvedProjects = projects.map((p) => {
  const videos = p.videos.filter((v) => media.videos[v.id]);
  if (media.videos[p.slug] && !videos.some((v) => v.id === p.slug)) {
    videos.push({ id: p.slug, label: { es: 'Video', en: 'Video' }, poster: p.cover });
  }
  return { ...p, videos: videos.map((v) => ({ ...v, sources: videoSources(v.id) })) };
});
export const bySlug = Object.fromEntries(resolvedProjects.map((p) => [p.slug, p]));

export function ctx(lang) {
  const t = (es, en) => (lang === 'en' ? en : es);
  const L = (o) => o?.[lang] ?? o?.es ?? '';
  const url = (path) => (lang === 'en' ? `/en${path}` : path);
  const cats = (p) => p.cats.map((c) => L(categories[c])).join(' · ');
  const alt = (p, i) => `${p.title} — ${p.client}${i != null ? ` · ${t('imagen', 'image')} ${i + 1}` : ''}`;
  return { lang, t, L, url, cats, alt };
}

export const icons = {
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M8 5h11v11"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="fill" d="M7 4.5v15l13-7.5z"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 5 5"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-8-4.8-8-11a4.4 4.4 0 0 1 8-2.6A4.4 4.4 0 0 1 20 9c0 6.2-8 11-8 11z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l1.2-4A8.3 8.3 0 1 1 8 18.8z"/><path d="M9 8.500c0 4 2.7 6.7 6.5 6.7l1-1.7-2.4-1.2-1 1c-1.5-.6-2.4-1.6-3-3l1-1-1.100-2.400z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle class="fill" cx="17" cy="7" r="1"/></svg>',
};
