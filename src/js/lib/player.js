import { el, t, clamp } from './util.js';

const ICON = {
  play: 'M7 4.5v15l13-7.5z', pause: 'M7 5h3.5v14H7zM13.500 5H17v14h-3.500z',
  sound: 'M4 9v6h4l5 4V5L8 9zM16 8.500a5 5 0 0 1 0 7', mute: 'M4 9v6h4l5 4V5L8 9zM16 9l6 6M22 9l-6 6',
  full: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5', pip: 'M3 5h18v14H3zM13 12h6v5h-6z',
};
function icon(name) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', ICON[name]);
  if (name === 'play' || name === 'pause') path.setAttribute('class', 'fill');
  svg.append(path);
  return svg;
}
const fmt = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');

/** Reproductor de video propio: calidad, velocidad, volumen, PiP, pantalla completa y teclado. */
export function createPlayer(root, { sources, poster, title = '', onEnded } = {}) {
  let src = sources;
  let quality;
  const video = el('video', { playsinline: true, preload: 'none' });
  const big = el('button', { type: 'button', class: 'player__big', 'aria-label': t('Reproducir', 'Play') }, icon('play'));
  const playBtn = el('button', { type: 'button', 'aria-label': t('Reproducir o pausar', 'Play or pause') }, icon('play'));
  const time = el('span', { class: 'player__time' }, '0:00 / 0:00');
  const buffered = el('i'), done = el('b');
  const seek = el('div', { class: 'player__seek', role: 'slider', tabindex: '0', 'aria-label': t('Posición', 'Seek'), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0' }, buffered, done);
  const speed = el('button', { type: 'button', class: 'player__speed', title: t('Velocidad', 'Speed') }, '1×');
  const qual = el('button', { type: 'button', title: t('Calidad', 'Quality') }, 'HD');
  const muteBtn = el('button', { type: 'button', 'aria-label': t('Silenciar', 'Mute') }, icon('sound'));
  const vol = el('input', { class: 'player__vol', type: 'range', min: '0', max: '1', step: '0.05', value: '1', 'aria-label': t('Volumen', 'Volume') });
  const pip = el('button', { type: 'button', class: 'player__pip', 'aria-label': 'Picture in picture' }, icon('pip'));
  const full = el('button', { type: 'button', 'aria-label': t('Pantalla completa', 'Fullscreen') }, icon('full'));
  if (!document.pictureInPictureEnabled) pip.hidden = true;
  const ui = el('div', { class: 'player__ui' }, seek, el('div', { class: 'player__row' }, playBtn, time, speed, qual, muteBtn, vol, pip, full));
  root.classList.add('player', 'is-paused');
  root.tabIndex = 0;
  root.setAttribute('role', 'group');
  root.replaceChildren(video, big, ui);

  const pickQuality = () => {
    const px = Math.max(root.clientWidth, root.clientHeight) * Math.min(devicePixelRatio, 2);
    const want = navigator.connection?.saveData ? '360p' : px > 1500 ? '1080p' : px > 640 ? '720p' : '360p';
    return src[want] ? want : src['720p'] ? '720p' : Object.keys(src)[0];
  };
  function setSource(q, keep = false) {
    const at = video.currentTime, was = !video.paused;
    quality = q;
    video.src = src[q];
    qual.textContent = q;
    if (keep) {
      video.addEventListener('loadedmetadata', () => { video.currentTime = at; if (was) video.play().catch(() => {}); }, { once: true });
      video.load();
    }
  }
  function load(next, nextPoster, nextTitle) {
    src = next;
    video.removeAttribute('src');
    video.poster = nextPoster || '';
    video.load();
    quality = null;
    root.setAttribute('aria-label', nextTitle || 'Video');
    root.classList.remove('has-started');
    done.style.width = buffered.style.width = '0%';
    time.textContent = '0:00 / 0:00';
  }
  const play = () => {
    if (!quality) setSource(pickQuality());
    return video.play().catch(() => {});
  };
  const toggle = () => (video.paused ? play() : video.pause());
  const seekTo = (ratio) => { if (video.duration) video.currentTime = clamp(ratio, 0, 1) * video.duration; };
  const fullscreen = () => {
    if (document.fullscreenElement) return document.exitFullscreen();
    if (root.requestFullscreen) return root.requestFullscreen();
    video.webkitEnterFullscreen?.(); // iOS
  };

  let touchedHidden = false;
  video.addEventListener('pointerdown', (e) => { touchedHidden = e.pointerType !== 'mouse' && !video.paused && !root.classList.contains('is-active'); });
  video.addEventListener('click', () => { if (touchedHidden) { touchedHidden = false; reveal(); } else toggle(); });
  big.addEventListener('click', play);
  playBtn.addEventListener('click', toggle);
  video.addEventListener('play', () => {
    for (const other of document.querySelectorAll('.player video')) if (other !== video) other.pause();
    root.classList.add('has-started'); root.classList.remove('is-paused'); playBtn.replaceChildren(icon('pause'));
  });
  video.addEventListener('pause', () => { root.classList.add('is-paused'); playBtn.replaceChildren(icon('play')); });
  video.addEventListener('ended', () => onEnded?.());
  const paint = () => {
    const p = video.duration ? video.currentTime / video.duration : 0;
    done.style.width = `${p * 100}%`;
    seek.setAttribute('aria-valuenow', Math.round(p * 100));
    time.textContent = `${fmt(video.currentTime)} / ${fmt(video.duration)}`;
    if (video.buffered.length && video.duration) buffered.style.width = `${(video.buffered.end(video.buffered.length - 1) / video.duration) * 100}%`;
  };
  for (const ev of ['timeupdate', 'progress', 'loadedmetadata', 'seeked']) video.addEventListener(ev, paint);
  const drag = (e) => { const r = seek.getBoundingClientRect(); seekTo((e.clientX - r.left) / r.width); };
  seek.addEventListener('pointerdown', (e) => { if (!quality) play(); seek.setPointerCapture(e.pointerId); drag(e); });
  seek.addEventListener('pointermove', (e) => { if (seek.hasPointerCapture(e.pointerId)) drag(e); });
  speed.addEventListener('click', () => {
    const list = [1, 1.25, 1.5, 2, 0.5];
    video.playbackRate = video.defaultPlaybackRate = list[(list.indexOf(video.playbackRate) + 1) % list.length];
    speed.textContent = `${video.playbackRate}×`;
  });
  qual.addEventListener('click', () => {
    const list = Object.keys(src);
    setSource(list[(list.indexOf(quality ?? pickQuality()) + 1) % list.length], true);
  });
  const paintVol = () => { muteBtn.replaceChildren(icon(video.muted || !video.volume ? 'mute' : 'sound')); vol.value = video.muted ? 0 : video.volume; };
  muteBtn.addEventListener('click', () => { video.muted = !video.muted; });
  vol.addEventListener('input', () => { video.volume = Number(vol.value); video.muted = video.volume === 0; });
  video.addEventListener('volumechange', paintVol);
  pip.addEventListener('click', async () => { await play(); document.pictureInPictureElement ? document.exitPictureInPicture() : video.requestPictureInPicture().catch(() => {}); });
  full.addEventListener('click', fullscreen);
  video.addEventListener('dblclick', fullscreen);
  let idle;
  function reveal() { root.classList.add('is-active'); clearTimeout(idle); idle = setTimeout(() => root.classList.remove('is-active'), 2800); }
  root.addEventListener('pointermove', reveal);
  ui.addEventListener('pointerdown', reveal);
  root.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if ((k === ' ' && e.target.tagName !== 'BUTTON') || k === 'k') toggle();
    else if (k === 'arrowright') video.currentTime += 5;
    else if (k === 'arrowleft') video.currentTime -= 5;
    else if (k === 'arrowup') video.volume = clamp(video.volume + 0.1, 0, 1);
    else if (k === 'arrowdown') video.volume = clamp(video.volume - 0.1, 0, 1);
    else if (k === 'm') video.muted = !video.muted;
    else if (k === 'f') fullscreen();
    else return;
    e.preventDefault();
    e.stopPropagation();
  });
  load(sources, poster, title);
  return { video, play, load, root };
}
