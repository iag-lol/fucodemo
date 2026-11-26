// Sala de edición: el scroll mueve el cabezal, los videos se reproducen con su audio y la
// línea de tiempo (pasos, fotogramas y forma de onda real) avanza sincronizada.
import { $, $$, el, t, reduced, saveData, clamp, scroll } from './lib/util.js';

const root = $('[data-timeline]');
if (root) init(root);

function init(section) {
  const { clips, rate } = JSON.parse($('[data-tl-data]', section).textContent);
  const offsets = [];
  const total = clips.reduce((sum, c) => { offsets.push(sum); return sum + c.duration; }, 0);

  const monitor = $('[data-monitor]', section), screen = $('[data-screen]', section);
  const videos = $$('video', screen);
  const nle = $('[data-nle]', section), playhead = $('[data-playhead]', section);
  const waveBox = $('[data-wave]', section), waveClip = $('[data-wave-clip]', section);
  const dim = $('[data-wave-dim]', section), lit = $('[data-wave-lit]', section);
  const stepClips = $$('[data-step]', section), panels = $$('[data-step-panel]', section);
  const bin = $$('[data-clip]', section), blocks = $$('[data-block]', section);
  const soundBtns = $$('[data-tl="sound"]', section), playBtn = $('[data-tl="play"]', section);
  const tc = $('[data-tl-tc]', section), link = $('[data-tl-link]', section);
  const meters = $$('.tl__vu i', section).map((m) => [...m.children]);

  let time = 0;              // posición global en segundos
  let active = 0;            // clip visible
  let soundOn = false;
  let userPaused = reduced || saveData;
  let scrubbing = false;     // el usuario está moviendo el cabezal (scroll o arrastre)
  let inView = false, near = false, running = false, step = -1;
  let anchor = { s: 0, p: 0 }, lastS = 0, idleTimer, pendingSeek = null, retryAt = 0;

  const timecode = (s) => {
    const f = Math.round(s * 24);
    const pad = (n) => String(Math.floor(n)).padStart(2, '0');
    return `${pad(f / 86400)}:${pad((f / 1440) % 60)}:${pad((f / 24) % 60)}:${pad(f % 24)}`;
  };
  $('[data-tl-total]', section).textContent = `/ ${timecode(total)}`;

  const clipAt = (s) => {
    let i = clips.length - 1;
    while (i > 0 && s < offsets[i]) i--;
    return [i, clamp(s - offsets[i], 0, clips[i].duration - 0.05)];
  };

  /* ---------- Carga de video ---------- */
  const quality = () => {
    const px = screen.clientWidth * Math.min(devicePixelRatio, 2);
    if (saveData || navigator.connection?.downlink < 4) return '360p'; // conexión lenta
    return px > 1700 ? '1080p' : px > 520 ? '720p' : '360p';
  };
  let chosen;
  function load(i, eager) {
    const v = videos[i];
    if (!v.src) {
      chosen ??= quality();
      v.preload = eager ? 'auto' : 'metadata';
      v.src = clips[i].sources[chosen] ?? clips[i].sources['720p'] ?? Object.values(clips[i].sources)[0];
    } else if (eager) v.preload = 'auto';
    return v;
  }
  // Los saltos se encadenan: mientras el video busca, solo se guarda el último destino.
  function seek(i, local) {
    const v = load(i, true);
    if (v.readyState < 1) { v.dataset.at = local; return; }
    if (v.seeking) { pendingSeek = { i, local }; return; }
    if (Math.abs(v.currentTime - local) > 0.04) {
      if (scrubbing && v.fastSeek) v.fastSeek(local); else v.currentTime = local;
    }
  }
  videos.forEach((v, i) => {
    v.addEventListener('loadedmetadata', () => { if (v.dataset.at) { v.currentTime = Number(v.dataset.at); delete v.dataset.at; } });
    v.addEventListener('seeked', () => {
      if (pendingSeek?.i === i) { const { local } = pendingSeek; pendingSeek = null; if (Math.abs(v.currentTime - local) > 0.08) v.currentTime = local; }
      if (i === active) reveal(i);
    });
    v.addEventListener('loadeddata', () => { if (i === active) reveal(i); });
    v.addEventListener('ended', () => { if (i === active && !scrubbing) jump((offsets[i] + clips[i].duration) % total, true); });
  });

  // El clip nuevo se muestra cuando ya tiene imagen; así no hay parpadeos en negro.
  let revealTimer;
  function reveal(i) {
    clearTimeout(revealTimer);
    videos.forEach((v, n) => v.classList.toggle('is-on', n === i));
  }
  function show(i) {
    if (i === active) return;
    const old = videos[active];
    active = i;
    old.pause();
    const v = load(i, true);
    if (i + 1 < clips.length && near) load(i + 1, false);
    v.muted = !soundOn;
    clearTimeout(revealTimer);
    if (v.readyState >= 2 && !v.seeking) reveal(i); else revealTimer = setTimeout(() => reveal(i), 700);
    const c = clips[i];
    $('[data-tl-count]', section).textContent = `${String(i + 1).padStart(2, '0')} / ${String(clips.length).padStart(2, '0')}`;
    $('[data-tl-client]', section).textContent = c.client;
    $('[data-tl-title]', section).textContent = c.title;
    link.href = c.url;
    const lower = $('[data-tl-lower]', section);
    lower.classList.remove('is-in'); void lower.offsetWidth; lower.classList.add('is-in');
  }

  /* ---------- Reproducción ---------- */
  const shouldPlay = () => inView && !userPaused && !scrubbing && !document.hidden && !document.querySelector('dialog[open], .menu.is-open');
  function sync() {
    const v = videos[active];
    if (shouldPlay()) {
      if (!v.paused || performance.now() < retryAt) return;
      load(active, true);
      v.muted = !soundOn;
      v.play().catch((err) => {
        // El navegador puede negar el audio: se sigue en silencio y se vuelve a ofrecer.
        if (err.name === 'NotAllowedError' && !v.muted) { setSound(false); v.play().catch(() => {}); }
        else if (err.name !== 'AbortError') retryAt = performance.now() + 1200; // p. ej. modo de bajo consumo
      });
    } else if (!v.paused) v.pause();
    videos.forEach((o, n) => { if (n !== active && !o.paused) o.pause(); });
  }
  function setSound(on) {
    soundOn = on;
    videos[active].muted = !on;
    section.classList.toggle('has-sound', on);
    for (const b of soundBtns) b.setAttribute('aria-pressed', on);
  }
  function toggleSound() {
    if (soundOn) return setSound(false);
    // Dentro del gesto del usuario se habilitan todos los videos (necesario en iPhone).
    videos.forEach((v, i) => {
      load(i, i === active);
      if (i === active) return;
      v.muted = true;
      v.play().then(() => { if (i !== active) v.pause(); }).catch(() => {});
    });
    userPaused = false;
    setSound(true);
    const hero = document.querySelector('.hero__video');
    if (hero && !hero.muted) document.querySelector('[data-sound]')?.click();
    videos[active].volume = 1;
    sync();
    videos[active].play().catch(() => {});
  }

  /* ---------- Posición ---------- */
  function setTime(s, doSeek) {
    time = clamp(s, 0, total - 0.05);
    const [i, local] = clipAt(time);
    show(i);
    if (doSeek) seek(i, local);
    paint();
  }
  function jump(s, play) {
    setTime(s, true);
    anchor = { s: progress(), p: time / total };
    if (play) sync();
  }
  function paint() {
    const p = time / total;
    nle.style.setProperty('--p', p);
    waveClip.style.width = `${p * 100}%`;
    tc.textContent = timecode(time);
    playhead.setAttribute('aria-valuenow', Math.round(p * 100));
    playhead.setAttribute('aria-valuetext', timecode(time));
    const n = clamp(Math.floor(p * stepClips.length), 0, stepClips.length - 1);
    if (n !== step) {
      step = n;
      stepClips.forEach((c, k) => c.classList.toggle('is-on', k === n));
      panels.forEach((c, k) => c.classList.toggle('is-on', k === n));
    }
    bin.forEach((b, k) => b.setAttribute('aria-current', k === active));
    blocks.forEach((b, k) => b.classList.toggle('is-on', k === active));
  }
  const peakAt = (s) => { const [i, local] = clipAt(s); return (clips[i].peaks[Math.floor(local * rate)] ?? 0) / 100; };

  function loop() {
    const v = videos[active];
    if (!scrubbing && !v.paused && !v.seeking && v.readyState >= 1 && v.dataset.at === undefined) {
      time = offsets[active] + v.currentTime;
      paint();
    }
    const playing = !v.paused;
    section.classList.toggle('is-playing', playing);
    const level = playing ? peakAt(time) : 0;
    meters.forEach((bars, side) => {
      const lvl = level * (side ? 0.9 + Math.abs(Math.sin(time * 7)) * 0.1 : 1) * bars.length;
      bars.forEach((b, k) => b.classList.toggle('on', k < lvl));
    });
    sync();
    if (inView || playing) requestAnimationFrame(loop); else running = false;
  }
  const wake = () => { if (!running) { running = true; requestAnimationFrame(loop); } };

  /* ---------- Scroll ---------- */
  const pinned = !reduced;
  section.classList.toggle('is-pinned', pinned);
  function progress() {
    if (!pinned) return 0;
    const r = section.getBoundingClientRect();
    return clamp(-r.top / Math.max(1, r.height - innerHeight), 0, 1);
  }
  function endScrub() {
    scrubbing = false;
    const [i, local] = clipAt(time);
    pendingSeek = null;
    seek(i, local);
    anchor = { s: progress(), p: time / total };
    wake();
  }
  function startScrub() {
    if (scrubbing) return;
    scrubbing = true;
    videos[active].pause();
  }
  function onScroll() {
    const r = section.getBoundingClientRect();
    const visible = r.top < innerHeight * 0.45 && r.bottom > innerHeight * 0.55;
    if (visible !== inView) { inView = visible; if (visible) wake(); else sync(); }
    document.body.classList.toggle('tl-active', pinned && r.top <= 2 && r.bottom >= innerHeight - 2);
    if (!pinned) return;
    const s = progress();
    if (Math.abs(s - lastS) < 0.00005) return;
    if (!scrubbing) { anchor = { s: lastS, p: time / total }; startScrub(); }
    // El scroll avanza desde donde quedó la reproducción, sin saltos, y llega justo a los extremos.
    const a = anchor;
    const p = s >= a.s ? (a.s >= 1 ? a.p : a.p + ((s - a.s) / (1 - a.s)) * (1 - a.p)) : a.p * (s / a.s);
    lastS = s;
    setTime(p * total, true);
    clearTimeout(idleTimer);
    idleTimer = setTimeout(endScrub, 180);
    wake();
  }
  function seekFromUser(p) {
    setTime(clamp(p, 0, 1) * total, true);
    anchor = { s: progress(), p: time / total };
    wake();
  }

  /* ---------- Arrastre sobre la línea de tiempo (mouse y dedo) ---------- */
  const ratioFrom = (x) => { const r = waveBox.getBoundingClientRect(); return (x - r.left) / r.width; };
  let drag = null;
  for (const area of [...$$('[data-scrub]', nle), $('[data-ruler]', nle).parentElement, playhead]) {
    area.addEventListener('pointerdown', (e) => {
      drag = { id: e.pointerId };
      area.setPointerCapture(e.pointerId);
      clearTimeout(idleTimer);
      startScrub();
      seekFromUser(ratioFrom(e.clientX));
    });
    area.addEventListener('pointermove', (e) => { if (drag?.id === e.pointerId) seekFromUser(ratioFrom(e.clientX)); });
    const up = (e) => { if (drag?.id !== e.pointerId) return; drag = null; endScrub(); };
    area.addEventListener('pointerup', up);
    area.addEventListener('pointercancel', up);
  }

  /* ---------- Controles ---------- */
  section.addEventListener('click', (e) => {
    const action = e.target.closest('[data-tl]')?.dataset.tl;
    const clip = e.target.closest('[data-clip]');
    const stepBtn = e.target.closest('[data-step]');
    if (clip) { userPaused = false; jump(offsets[Number(clip.dataset.clip)] + 0.01, true); }
    else if (stepBtn) jump(((Number(stepBtn.dataset.step) + 0.04) / stepClips.length) * total, true);
    else if (action === 'sound') toggleSound();
    else if (action === 'play') { userPaused = !videos[active].paused; sync(); wake(); }
    else if (action === 'next') jump(offsets[(active + 1) % clips.length] + 0.01, true);
    else if (action === 'prev') jump(offsets[time - offsets[active] > 2 ? active : (active - 1 + clips.length) % clips.length] + 0.01, true);
    else if (action === 'full') {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (monitor.requestFullscreen) monitor.requestFullscreen();
      else videos[active].webkitEnterFullscreen?.();
    } else if (e.target.closest('[data-screen]')) {
      // Primer toque: sonido. Después: pausa y reproducción.
      if (!soundOn) toggleSound(); else { userPaused = !videos[active].paused; sync(); wake(); }
    }
  });
  section.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return; // p. ej. Ctrl+K abre el buscador
    if (e.target.closest('a, button') && (e.key === ' ' || e.key === 'Enter')) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'k') { userPaused = !videos[active].paused; sync(); wake(); }
    else if (k === 'arrowright') jump(time + 5, true);
    else if (k === 'arrowleft') jump(time - 5, true);
    else if (k === 'm') toggleSound();
    else return;
    e.preventDefault();
  });

  /* ---------- Dibujo de la regla, fotogramas y forma de onda ---------- */
  function draw() {
    const w = waveBox.clientWidth, h = waveBox.clientHeight;
    if (!w || !h) return;
    const ratio = Math.min(devicePixelRatio, 2);
    for (const [canvas, color] of [[dim, 'rgba(96, 190, 160, .34)'], [lit, '#5fd9b4']]) {
      canvas.width = w * ratio; canvas.height = h * ratio;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      const g = canvas.getContext('2d');
      g.scale(ratio, ratio);
      g.fillStyle = color;
      for (let x = 0; x < w; x += 3) {
        const s = (x / w) * total;
        const [i] = clipAt(s);
        if (offsets[i] && s - offsets[i] < (3 / w) * total) continue; // corte entre clips
        const bar = Math.max(1.5, peakAt(s) ** 1.25 * (h - 6));
        g.fillRect(x, (h - bar) / 2, 2, bar);
      }
    }
    const marks = w < 500 ? 4 : 8;
    $('[data-ruler]', section).replaceChildren(...Array.from({ length: marks }, (_, k) => el('span', {}, timecode((k / marks) * total).slice(3, 8))));
    for (const [i, block] of blocks.entries()) {
      const count = clamp(Math.round(block.clientWidth / (block.clientHeight * 1.5 || 60)), 1, 8);
      if (Number(block.dataset.count) === count) continue;
      block.dataset.count = count;
      $$('img', block).forEach((n) => n.remove());
      block.prepend(...Array.from({ length: count }, (_, k) => el('img', { src: clips[i].frames[Math.floor((k * 8) / count)], alt: '', draggable: 'false', loading: 'lazy' })));
    }
  }
  new ResizeObserver(draw).observe(waveBox);

  new IntersectionObserver(([entry], io) => {
    if (!entry.isIntersecting) return;
    near = true; io.disconnect();
    load(active, true); load(1, false);
  }, { rootMargin: '120% 0px' }).observe(section);

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  document.addEventListener('visibilitychange', () => { sync(); wake(); });
  // Al abrir el showreel u otro diálogo, esta reproducción se detiene.
  new MutationObserver(() => { sync(); if (inView) wake(); }).observe(document.body, { childList: true });
  scroll.timeline = { get time() { return time; }, get total() { return total; } };

  lastS = progress();
  anchor = { s: 0, p: 0 };
  setTime(lastS * total, false);
  draw();
  onScroll();
  section.setAttribute('data-ready', t('listo', 'ready'));
}
