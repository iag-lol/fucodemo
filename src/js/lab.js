// Laboratorio de color en WebGL. Todo ocurre en el dispositivo del visitante.
import { $, $$, t, toast, clamp } from './lib/util.js';

const root = $('[data-lab]');
const canvas = $('[data-canvas]', root);
const stage = $('[data-stage]', root);
const line = $('[data-split-line]', root);
const histo = $('[data-histo]', root);
const gl = canvas.getContext('webgl', { preserveDrawingBuffer: false });

const PARAMS = $$('[data-param]', root).map((i) => i.dataset.param);
const ZERO = Object.fromEntries(PARAMS.map((p) => [p, 0]));
const PRESETS = [
  ['Original', {}],
  [t('Nieve', 'Snow'), { exposure: -8, contrast: 18, highlights: -30, temperature: -22, saturation: 8, shadows: 12 }],
  [t('Pasarela', 'Runway'), { contrast: 24, shadows: -10, temperature: 8, saturation: 6, split: 55, vignette: 40 }],
  ['Rec Club', { exposure: -6, contrast: 30, temperature: 20, tint: 28, saturation: 25, vignette: 55, aberration: 35 }],
  [t('Análogo 400', 'Analog 400'), { contrast: -8, temperature: 18, saturation: -14, fade: 42, grain: 48, vignette: 22 }],
  [t('Plata B/N', 'Silver B&W'), { saturation: -100, contrast: 38, highlights: -10, shadows: -8, grain: 34, vignette: 30 }],
  [t('Hora dorada', 'Golden hour'), { exposure: 6, temperature: 42, tint: 8, highlights: -12, shadows: 20, saturation: 12, fade: 12 }],
];

if (!gl) {
  $('.lab__nogl').hidden = false;
  canvas.hidden = line.hidden = true;
} else init();

function init() {
  const values = { ...ZERO };
  let split = 0.5, image, queued = false;
  const compile = (type, code) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, code); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, 'attribute vec2 p; varying vec2 v; void main(){ v = p * .5 + .5; v.y = 1. - v.y; gl_Position = vec4(p, 0., 1.); }'));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, `precision highp float;
    varying vec2 v; uniform sampler2D img; uniform float uSplit, uAspect; uniform vec2 uRes;
    uniform float exposure, contrast, highlights, shadows, temperature, tint, saturation, split, fade, grain, vignette, aberration;
    float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    float luma(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }
    void main(){
      if (v.x < uSplit) { gl_FragColor = vec4(texture2D(img, v).rgb, 1.); return; }
      vec2 off = (v - .5) * aberration * .018;
      vec3 c = vec3(texture2D(img, v - off).r, texture2D(img, v).g, texture2D(img, v + off).b);
      c *= pow(2., exposure * 1.4);
      c += vec3(.11, 0., -.11) * temperature + vec3(.035, -.07, .035) * tint;
      float l = luma(c);
      c += shadows * .28 * (1. - smoothstep(0., .62, l));
      c += highlights * .3 * smoothstep(.4, 1., l);
      c = (c - .5) * (1. + contrast * (contrast > 0. ? .75 : .55)) + .5;
      l = luma(clamp(c, 0., 1.));
      c = mix(vec3(l), c, 1. + saturation);
      c += split * (vec3(-.07, .025, .085) * (1. - smoothstep(0., .6, l)) + vec3(.095, .025, -.075) * smoothstep(.4, 1., l));
      c = clamp(c, 0., 1.);
      c = c * (1. - fade * .2) + fade * .13;
      float d = distance(v, vec2(.5));
      c *= 1. - vignette * .8 * smoothstep(.28, .78, d);
      float n = hash(floor(v * vec2(1100. * uAspect, 1100.))) - .5;
      c += n * grain * .22 * (1. - l * .5);
      gl_FragColor = vec4(c, 1.);
    }`));
  gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = Object.fromEntries(['uSplit', 'uAspect', 'uRes', ...PARAMS].map((n) => [n, gl.getUniformLocation(prog, n)]));
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  for (const [k, val] of [[gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE], [gl.TEXTURE_MIN_FILTER, gl.LINEAR]]) gl.texParameteri(gl.TEXTURE_2D, k, val);
  const maxSize = Math.min(4096, gl.getParameter(gl.MAX_TEXTURE_SIZE));

  const draw = (atSplit) => {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(U.uSplit, atSplit);
    gl.uniform1f(U.uAspect, canvas.width / canvas.height);
    for (const p of PARAMS) gl.uniform1f(U[p], values[p] / 100);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const small = document.createElement('canvas');
  small.width = 160; small.height = 100;
  const sctx = small.getContext('2d', { willReadFrequently: true });
  const hctx = histo.getContext('2d');
  function drawHistogram() {
    sctx.drawImage(canvas, 0, 0, small.width, small.height);
    const px = sctx.getImageData(0, 0, small.width, small.height).data;
    const bins = [new Uint32Array(64), new Uint32Array(64), new Uint32Array(64)];
    for (let i = 0; i < px.length; i += 4) for (let ch = 0; ch < 3; ch++) bins[ch][px[i + ch] >> 2]++;
    const max = Math.max(1, ...bins.flatMap((b) => [...b.slice(1, 63)]));
    hctx.clearRect(0, 0, histo.width, histo.height);
    hctx.globalCompositeOperation = 'lighter';
    ['#b0342b', '#2f9a4a', '#2b5fc2'].forEach((color, ch) => {
      hctx.fillStyle = color;
      hctx.beginPath(); hctx.moveTo(0, histo.height);
      bins[ch].forEach((n, i) => hctx.lineTo((i / 63) * histo.width, histo.height - Math.min(1, n / max) * (histo.height - 4)));
      hctx.lineTo(histo.width, histo.height); hctx.fill();
    });
  }
  function place() {
    const c = canvas.getBoundingClientRect(), s = stage.getBoundingClientRect();
    line.style.left = `${c.left - s.left - 1 + c.width * split}px`;
    line.style.top = `${c.top - s.top - 1}px`;
    line.style.height = `${c.height}px`;
  }
  function render() {
    if (queued || !image) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; draw(0); drawHistogram(); draw(split); place(); });
  }
  function setImage(source, w, h) {
    const k = Math.min(1, maxSize / Math.max(w, h));
    const buffer = document.createElement('canvas');
    buffer.width = Math.round(w * k); buffer.height = Math.round(h * k);
    buffer.getContext('2d').drawImage(source, 0, 0, buffer.width, buffer.height);
    image = buffer;
    const view = Math.min(1, 1600 / Math.max(buffer.width, buffer.height));
    canvas.width = Math.round(buffer.width * view); canvas.height = Math.round(buffer.height * view);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
    render();
  }
  const loadSample = (src) => { const img = new Image(); img.onload = () => setImage(img, img.width, img.height); img.src = src; };

  const syncUI = () => $$('[data-param]', root).forEach((input) => {
    input.value = values[input.dataset.param];
    $(`[data-out="${input.dataset.param}"]`, root).textContent = values[input.dataset.param];
  });
  const chips = $('[data-presets]', root);
  const mark = (active) => [...chips.children].forEach((c) => c.setAttribute('aria-pressed', c === active));
  PRESETS.forEach(([name, preset]) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.textContent = name; b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => { Object.assign(values, ZERO, preset); syncUI(); mark(b); render(); });
    chips.append(b);
  });
  mark(chips.firstChild);
  $$('[data-param]', root).forEach((input) => {
    input.addEventListener('input', () => { values[input.dataset.param] = Number(input.value); $(`[data-out="${input.dataset.param}"]`, root).textContent = input.value; mark(null); render(); });
    input.addEventListener('dblclick', () => { input.value = 0; input.dispatchEvent(new Event('input')); });
  });
  $('[data-lab-reset]', root).addEventListener('click', () => chips.firstChild.click());

  const moveSplit = (e) => { const c = canvas.getBoundingClientRect(); split = clamp((e.clientX - c.left) / c.width, 0, 1); render(); };
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); moveSplit(e); });
  canvas.addEventListener('pointermove', (e) => { if (canvas.hasPointerCapture(e.pointerId)) moveSplit(e); });
  canvas.tabIndex = 0;
  canvas.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); split = clamp(split + (e.key === 'ArrowLeft' ? -0.05 : 0.05), 0, 1); render();
  });
  new ResizeObserver(() => place()).observe(stage);

  const samples = $$('[data-sample]', root);
  samples.forEach((b) => b.addEventListener('click', () => { samples.forEach((o) => o.setAttribute('aria-pressed', o === b)); loadSample(b.dataset.sample); }));
  async function useFile(file) {
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type)) return toast(t('Usa una imagen JPG, PNG o WebP', 'Use a JPG, PNG or WebP image'));
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      setImage(bmp, bmp.width, bmp.height);
      samples.forEach((o) => o.setAttribute('aria-pressed', 'false'));
    } catch { toast(t('No pudimos abrir esa imagen', 'We could not open that image')); }
  }
  $('[data-upload]', root).addEventListener('change', (e) => useFile(e.target.files[0]));
  for (const ev of ['dragover', 'dragenter']) stage.addEventListener(ev, (e) => { e.preventDefault(); stage.classList.add('is-drop'); });
  stage.addEventListener('dragleave', (e) => { if (!stage.contains(e.relatedTarget)) stage.classList.remove('is-drop'); });
  stage.addEventListener('drop', (e) => { e.preventDefault(); stage.classList.remove('is-drop'); useFile(e.dataTransfer.files[0]); });

  $('[data-lab-export]', root).addEventListener('click', () => {
    if (!image) return;
    const { width, height } = canvas;
    canvas.width = image.width; canvas.height = image.height;
    draw(0);
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'fuco-lab.jpg'; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast(t('Imagen descargada', 'Image downloaded'));
    }, 'image/jpeg', 0.93);
    canvas.width = width; canvas.height = height;
    render();
  });
  canvas.addEventListener('webglcontextlost', (e) => e.preventDefault());
  canvas.addEventListener('webglcontextrestored', () => location.reload());
  loadSample(samples[0].dataset.sample);
}
