import { el, t, overlay, siteData } from './util.js';
import { createPlayer } from './player.js';

/** Showreel: todos los videos en una lista de reproducción continua. */
export async function openReel(startId) {
  const { projects } = await siteData();
  const list = projects.flatMap((p) => p.videos.map((v) => ({ ...v, title: p.title, client: p.client, url: p.url })));
  // La pieza de marca abre el showreel.
  list.sort((a, b) => Number(b.id.endsWith(':hero')) - Number(a.id.endsWith(':hero')));
  let i = Math.max(0, list.findIndex((v) => v.id === startId));
  let player;
  const { dlg, open } = overlay('ov--reel', 'Showreel', () => player?.video.pause());
  const stageBox = el('div');
  const heading = el('h2');
  const link = el('a', { class: 'link' }, t('Ver proyecto', 'View project'));
  const items = list.map((v, k) => el('button', { type: 'button', onclick: () => go(k) }, el('img', { src: v.poster, alt: '', loading: 'lazy' }),
    el('span', {}, el('b', {}, v.title), el('small', {}, `${v.client} · ${v.label}`))));
  dlg.append(el('div', { class: 'reel' },
    el('div', { class: 'reel__stage' }, stageBox, el('div', { class: 'reel__title' }, heading, link)),
    el('div', { class: 'reel__list' }, items)));
  function go(k) {
    i = (k + list.length) % list.length;
    const v = list[i];
    if (!player) player = createPlayer(stageBox, { sources: v.sources, poster: v.poster, title: v.title, onEnded: () => go(i + 1) });
    else player.load(v.sources, v.poster, v.title);
    heading.textContent = `${v.title} — ${v.client}`;
    link.href = v.url;
    items.forEach((b, n) => b.setAttribute('aria-current', n === i));
    items[i].scrollIntoView({ block: 'nearest' });
    player.play();
  }
  open();
  go(i);
  player.root.focus();
}
