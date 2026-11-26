// Portada y secciones animadas (también usado en la página «Nosotros»).
import './timeline.js';
import { peek } from './lib/peek.js';
import { $, $$, t, reduced, fine, saveData, clamp, scroll } from './lib/util.js';

const { gsap, ScrollTrigger } = window;
gsap?.registerPlugin(ScrollTrigger);
const animated = !!gsap && !reduced;

/* Video de portada + visor de cámara */
const hero = $('[data-hero]');
if (hero) {
  const video = $('.hero__video', hero);
  const tc = $('[data-timecode]', hero);
  const sound = $('[data-sound]', hero);
  const meter = $$('[data-meter] i', hero);
  const reticle = $('[data-reticle]', hero);
  let visible = true;
  const autoplay = !reduced && !saveData;
  // Safari/iPhone exigen que esté silenciado antes de asignar la fuente y a veces rechazan el primer
  // intento: se declara autoplay y se reintenta cuando el video ya puede verse.
  video.muted = video.defaultMuted = true;
  if (autoplay) { video.autoplay = true; video.preload = 'auto'; }
  // El encuadre a pantalla completa amplía también el video en celulares verticales.
  // 1080p evita ampliar las versiones de 360p y 720p; el ahorro de datos usa 720p.
  video.src = saveData
    ? video.dataset.md || video.dataset.hd || video.dataset.sd
    : video.dataset.hd || video.dataset.md || video.dataset.sd;
  const start = () => { if (autoplay && visible && video.paused) video.play().catch(() => {}); };
  for (const ev of ['loadeddata', 'canplay']) video.addEventListener(ev, start);
  for (const ms of [0, 700, 1800, 3500]) setTimeout(start, ms);
  for (const ev of ['touchend', 'pointerdown', 'pageshow']) addEventListener(ev, start, { passive: true });
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (!visible) video.pause(); else start();
  }, { threshold: 0.05 }).observe(hero);
  sound.addEventListener('click', () => {
    video.muted = !video.muted;
    if (video.paused) video.play().catch(() => {});
    sound.setAttribute('aria-pressed', !video.muted);
    $('b', sound).textContent = video.muted ? 'off' : 'on';
  });
  // Al abrir el showreel o el menú, la portada se silencia.
  document.addEventListener('click', (e) => { if (e.target.closest('[data-reel]') && !video.muted) sound.click(); }, true);

  const pad = (n) => String(Math.floor(n)).padStart(2, '0');
  let last = 0;
  const hud = (now) => {
    if (visible) {
      const s = video.currentTime;
      tc.textContent = `00:${pad(s / 60)}:${pad(s % 60)}:${pad((s % 1) * 24)}`;
      if (now - last > 110) {
        last = now;
        const level = video.paused ? 0 : 5 + Math.abs(Math.sin(s * 5.3) * 5 + Math.sin(s * 13.7) * 3);
        meter.forEach((bar, i) => bar.classList.toggle('on', i < level));
      }
    }
    requestAnimationFrame(hud);
  };
  requestAnimationFrame(hud);

  if (!reduced) {
    let tx = 0, ty = 0, x = 0, y = 0, lockTimer, running = false;
    const follow = () => {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      reticle.style.transform = `translate(${x}px, ${y}px)`;
      if (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) requestAnimationFrame(follow); else running = false;
    };
    const aim = (px, py) => {
      tx = px; ty = py;
      reticle.classList.add('is-on'); reticle.classList.remove('is-locked');
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => reticle.classList.add('is-locked'), 520);
      if (!running) { running = true; requestAnimationFrame(follow); }
    };
    const aimEvent = (e) => { const r = reticle.parentElement.getBoundingClientRect(); aim(e.clientX - r.left, e.clientY - r.top); };
    if (fine) {
      hero.addEventListener('pointermove', aimEvent);
      hero.addEventListener('pointerleave', () => reticle.classList.remove('is-on'));
    } else {
      // En pantallas táctiles el enfoque sigue el toque y, en reposo, busca solo.
      let touched = 0;
      hero.addEventListener('pointerdown', (e) => { touched = Date.now(); aimEvent(e); });
      const hunt = () => {
        const box = reticle.parentElement;
        if (visible && Date.now() - touched > 4000) aim(box.clientWidth * (0.25 + Math.random() * 0.5), box.clientHeight * (0.16 + Math.random() * 0.28));
      };
      setTimeout(hunt, 2200); setInterval(hunt, 2800);
    }
  }
  if (animated) {
    gsap.fromTo('[data-hero-media]', { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, {
      clipPath: 'inset(9% 7% 9% 7% round 26px)', ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 25%', scrub: true },
    });
    gsap.to('.hud', { opacity: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: '35% top', scrub: true } });
  }
}

/* Vista previa flotante de las imágenes del manifiesto */
peek($('.manifesto'));

/* Manifiesto que se ilumina palabra por palabra */
const manifesto = $('.manifesto__text');
if (manifesto && animated) {
  const words = [];
  (function wrap(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part.trim()) { frag.append(part); continue; }
          const span = document.createElement('span'); span.className = 'word'; span.textContent = part;
          words.push(span); frag.append(span);
        }
        child.replaceWith(frag);
      } else if (child.classList?.contains('inline-pic')) { child.classList.add('word'); words.push(child); }
      else wrap(child);
    }
  })(manifesto);
  manifesto.closest('.manifesto').classList.add('is-scrub');
  ScrollTrigger.create({
    trigger: manifesto, start: 'top 82%', end: 'bottom 48%', scrub: true,
    onUpdate: (self) => { const n = Math.ceil(self.progress * words.length); words.forEach((w, i) => w.classList.toggle('is-lit', i < n)); },
  });
}

/* Proyectos destacados en horizontal: el scroll vertical (o el dedo) los desplaza */
const featured = $('[data-hscroll]');
if (featured && !reduced) {
  const pin = $('.featured__pin', featured), track = $('[data-track]', featured), progress = $('[data-progress]', featured);
  const cards = [...track.children];
  let distance = 0, enabled = false, queued = false, width = 0;
  const range = () => Math.max(1, featured.offsetHeight - pin.offsetHeight);
  const update = () => {
    queued = false;
    if (!enabled) return;
    const p = clamp(-featured.getBoundingClientRect().top / range(), 0, 1);
    track.style.transform = `translate3d(${-p * distance}px, 0, 0)`;
    progress.style.transform = `scaleX(${p})`;
    // La tarjeta central gana protagonismo.
    const center = innerWidth / 2 + p * distance;
    for (const card of cards) {
      const off = Math.min(1, Math.abs(card.offsetLeft + card.offsetWidth / 2 - center) / innerWidth);
      card.style.transform = `scale(${1 - off * 0.1})`;
      card.style.opacity = 1 - off * 0.35;
    }
  };
  const measure = () => {
    width = innerWidth;
    enabled = innerHeight >= 500;
    featured.classList.toggle('is-pinned', enabled);
    if (!enabled) { track.style.transform = ''; cards.forEach((c) => { c.style.transform = c.style.opacity = ''; }); return; }
    pin.scrollLeft = 0; track.scrollLeft = 0;
    distance = Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
    featured.style.setProperty('--dist', `${distance}px`);
    update();
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', queue, { passive: true });
  // En celular la barra del navegador cambia el alto al desplazar: solo se recalcula si cambia el ancho.
  addEventListener('resize', () => { if (innerWidth !== width || fine) { measure(); ScrollTrigger?.refresh(); } });
  // Deslizar de lado con el dedo avanza la secuencia.
  let touch = null, swiped = false;
  track.addEventListener('pointerdown', (e) => { swiped = false; if (e.pointerType !== 'mouse' && enabled) touch = { x: e.clientX, y: e.clientY }; });
  track.addEventListener('pointermove', (e) => {
    if (!touch) return;
    const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    if (!swiped && Math.abs(dx) < 8) return;
    if (!swiped && Math.abs(dy) > Math.abs(dx)) { touch = null; return; }
    swiped = true;
    scrollBy(0, -dx * (range() / Math.max(1, distance)));
    touch = { x: e.clientX, y: e.clientY };
  });
  for (const ev of ['pointerup', 'pointercancel']) track.addEventListener(ev, () => { touch = null; });
  track.addEventListener('click', (e) => { if (swiped) { e.preventDefault(); e.stopPropagation(); swiped = false; } }, true);
  // Con teclado, llevar el scroll hasta la tarjeta enfocada.
  track.addEventListener('focusin', (e) => {
    const card = e.target.closest('.card, .featured__end');
    if (!enabled || !card || !e.target.matches(':focus-visible')) return;
    pin.scrollLeft = 0;
    const y = featured.getBoundingClientRect().top + scrollY + (clamp(card.offsetLeft - innerWidth / 4, 0, distance) / Math.max(1, distance)) * range();
    scroll.lenis ? scroll.lenis.scrollTo(y) : scrollTo(0, y);
  });
  measure();
}

/* Contadores */
if (!reduced) {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      const end = Number(e.target.dataset.counter), start = performance.now();
      const step = (now) => { const p = clamp((now - start) / 1400, 0, 1); e.target.textContent = Math.round(end * (1 - (1 - p) ** 3)); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }
  }, { threshold: 0.6 });
  $$('[data-counter]').forEach((n) => io.observe(n));
}

if (animated && $('[data-parallax-band]')) {
  gsap.fromTo('[data-parallax-band] > img', { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '[data-parallax-band]', start: 'top bottom', end: 'bottom top', scrub: true } });
}
if (ScrollTrigger) { ScrollTrigger.sort(); ScrollTrigger.refresh(); }

/* Índice en pantallas táctiles: la fila del centro se destaca al desplazar */
if (!fine) {
  // Franja mínima en el centro (en píxeles: los porcentajes de rootMargin se calculan sobre el ancho).
  const edge = Math.floor(innerHeight / 2) - 1;
  const spot = new IntersectionObserver((entries) => { for (const e of entries) e.target.classList.toggle('is-center', e.isIntersecting); }, { rootMargin: `-${edge}px 0px -${edge}px 0px` });
  $$('[data-index] li').forEach((li) => spot.observe(li));
}

/* Índice con vista previa distorsionada (WebGL) */
const index = $('[data-index]');
if (index && fine && !reduced) {
  const canvas = $('[data-preview-canvas]', index);
  const gl = canvas.getContext('webgl', { premultipliedAlpha: false });
  if (gl) {
    const compile = (type, code) => { const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; v.y = 1. - v.y; gl_Position = vec4(p, 0., 1.); }'));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `precision mediump float;
      varying vec2 v; uniform sampler2D a, b; uniform float mixv, time, ra, rb; uniform vec2 vel;
      vec2 cover(vec2 uv, float r){ float c = .8; vec2 s = r > c ? vec2(c / r, 1.) : vec2(1., r / c); return (uv - .5) * s + .5; }
      void main(){
        float wave = sin(v.y * 9. + time * 3.) * .035;
        vec2 bend = vec2(sin(v.y * 3.14159) * vel.x, sin(v.x * 3.14159) * vel.y) * .35;
        float m = smoothstep(0., 1., clamp(mixv * 1.6 - v.y * .6 + wave, 0., 1.));
        vec2 uva = cover(v - bend + vec2(wave * m * 2., 0.), ra), uvb = cover(v - bend - vec2(wave * (1. - m) * 2., 0.), rb);
        vec2 shift = vel * .12;
        vec3 ca = vec3(texture2D(a, uva + shift).r, texture2D(a, uva).g, texture2D(a, uva - shift).b);
        vec3 cb = vec3(texture2D(b, uvb + shift).r, texture2D(b, uvb).g, texture2D(b, uvb - shift).b);
        gl_FragColor = vec4(mix(ca, cb, m), 1.);
      }`));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    const u = Object.fromEntries(['a', 'b', 'mixv', 'time', 'vel', 'ra', 'rb'].map((n) => [n, gl.getUniformLocation(prog, n)]));
    gl.uniform1i(u.a, 0); gl.uniform1i(u.b, 1);
    const cache = new Map();
    const texture = (src) => {
      if (cache.has(src)) return cache.get(src);
      const item = { tex: gl.createTexture(), ratio: 0.8, ready: false };
      const put = (data) => {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, item.tex);
        for (const [k, val] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
        if (data) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
        else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([18, 18, 20, 255]));
      };
      put();
      const img = new Image();
      img.onload = () => { put(img); item.ratio = img.width / img.height; item.ready = true; };
      img.src = src;
      cache.set(src, item);
      return item;
    };
    let from, to, mixv = 1, on = false, raf = 0, tx = 0, ty = 0, x = 0, y = 0;
    const draw = (now) => {
      const dx = tx - x, dy = ty - y;
      x += dx * 0.12; y += dy * 0.12;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      const left = tx > innerWidth * 0.62 ? x - w - 40 : x + 40;
      canvas.style.transform = `translate(${left}px, ${clamp(y - h / 2, 90, innerHeight - h - 10)}px) rotate(${clamp(dx * 0.025, -8, 8)}deg)`;
      if (to?.ready) mixv = Math.min(1, mixv + 0.035);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, from.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, to.tex);
      gl.uniform1f(u.mixv, mixv); gl.uniform1f(u.time, now / 1000);
      gl.uniform2f(u.vel, clamp(dx / 900, -0.25, 0.25), clamp(dy / 900, -0.25, 0.25));
      gl.uniform1f(u.ra, from.ratio); gl.uniform1f(u.rb, to.ratio);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = on ? requestAnimationFrame(draw) : 0;
    };
    for (const a of $$('a[data-preview]', index)) {
      a.addEventListener('pointerenter', (e) => {
        const next = texture(a.dataset.preview);
        if (!on) { x = tx = e.clientX; y = ty = e.clientY; }
        from = to ?? next; to = next; mixv = 0; on = true;
        canvas.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(draw);
      });
    }
    const list = $('ul', index);
    list.addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; });
    const hide = () => { on = false; canvas.classList.remove('is-on'); };
    list.addEventListener('pointerleave', hide);
    addEventListener('scroll', () => { if (on && !list.matches(':hover')) hide(); }, { passive: true });
  }
}
