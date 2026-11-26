import { layout } from './layout.mjs';
import { ctx, src, icons } from './helpers.mjs';
import { pageHead } from './components.mjs';
import { services, quoteOptions } from '../data/content.mjs';
import { site } from '../data/site.mjs';

export function archivePage(lang) {
  const c = ctx(lang);
  const { t, url } = c;
  const body = `<section class="archive" data-archive data-cursor="${t('Arrastra', 'Drag')}">
  <h1 class="sr">${t('Archivo visual', 'Visual archive')}</h1>
  <div class="archive__plane" data-plane></div>
  <div class="archive__ui">
    <p><b>${t('Archivo', 'Archive')}</b> <span data-archive-count></span><br><small>${t('Arrastra, usa la rueda o las flechas. Clic para ampliar.', 'Drag, scroll or use arrow keys. Click to enlarge.')}</small></p>
    <div class="chips" data-archive-filters></div>
    <a class="btn btn--sm" href="${url('/proyectos/')}">${t('Ver por proyecto', 'Browse by project')}</a>
  </div>
</section>`;
  return layout(lang, { path: '/archivo/', page: 'archive', title: t('Archivo visual', 'Visual archive'), body, scripts: ['archive'], footer: false });
}

export function labPage(lang) {
  const c = ctx(lang);
  const { t } = c;
  const samples = ['ffl-05', 'ffl-03', 'terrex-02', 'bike-06', 'under-armour', 'pombo', 'takis-intense', 'paris-parade'];
  const controls = [
    ['exposure', t('Exposición', 'Exposure'), -100, 100],
    ['contrast', t('Contraste', 'Contrast'), -100, 100],
    ['highlights', t('Altas luces', 'Highlights'), -100, 100],
    ['shadows', t('Sombras', 'Shadows'), -100, 100],
    ['temperature', t('Temperatura', 'Temperature'), -100, 100],
    ['tint', t('Matiz', 'Tint'), -100, 100],
    ['saturation', t('Saturación', 'Saturation'), -100, 100],
    ['split', t('Teal & orange', 'Teal & orange'), 0, 100],
    ['fade', t('Negros lavados', 'Faded blacks'), 0, 100],
    ['grain', t('Grano', 'Grain'), 0, 100],
    ['vignette', t('Viñeta', 'Vignette'), 0, 100],
    ['aberration', t('Aberración', 'Aberration'), 0, 100],
  ];
  const body = `
${pageHead('Lab', t('Laboratorio <em>de color</em>', 'Colour <em>lab</em>'), t('Revela como en postproducción: elige un look, ajusta y compara. Puedes cargar tu propia foto; se procesa solo en tu dispositivo y no se sube a ningún servidor.', 'Grade like in post: pick a look, tweak and compare. You can load your own photo; it is processed only on your device and never uploaded.'))}
<section class="lab wrap" data-lab>
  <div class="lab__stage">
    <div class="lab__canvas" data-stage>
      <canvas data-canvas aria-label="${t('Vista previa', 'Preview')}"></canvas>
      <i class="lab__split" data-split-line><b>⟷</b></i>
      <span class="compare__tag compare__tag--l">${t('Antes', 'Before')}</span><span class="compare__tag compare__tag--r">${t('Después', 'After')}</span>
      <p class="lab__drop">${t('Suelta tu foto aquí', 'Drop your photo here')}</p>
      <p class="lab__nogl" hidden>${t('Tu navegador no permite WebGL, necesario para el laboratorio.', 'Your browser does not allow WebGL, required for the lab.')}</p>
    </div>
    <div class="lab__strip" role="group" aria-label="${t('Fotos de muestra', 'Sample photos')}">
      ${samples.map((n, i) => `<button type="button" data-sample="${src(n, 1600)}" aria-pressed="${i === 0}"><img src="${src(n, 480)}" alt="${t('Muestra', 'Sample')} ${i + 1}" loading="lazy"></button>`).join('')}
      <label class="lab__upload">+ ${t('Tu foto', 'Your photo')}<input type="file" accept="image/jpeg,image/png,image/webp" data-upload></label>
    </div>
  </div>
  <div class="lab__panel">
    <div class="lab__histo"><canvas data-histo width="256" height="90" aria-label="${t('Histograma', 'Histogram')}"></canvas></div>
    <div class="chips" data-presets role="group" aria-label="Looks"></div>
    <div class="lab__sliders">${controls.map(([k, l, min, max]) => `<label><span>${l}<output data-out="${k}">0</output></span><input type="range" data-param="${k}" min="${min}" max="${max}" value="0"></label>`).join('')}</div>
    <div class="lab__actions"><button type="button" class="btn btn--sm" data-lab-reset>${t('Restablecer', 'Reset')}</button><button type="button" class="btn btn--sm btn--solid" data-lab-export>${t('Descargar JPG', 'Download JPG')}</button></div>
  </div>
</section>`;
  return layout(lang, { path: '/lab/', page: 'lab', title: t('Laboratorio de color', 'Colour lab'), body, scripts: ['lab'] });
}

export function quotePage(lang) {
  const c = ctx(lang);
  const { t, L, url } = c;
  const opt = (name, o, type = 'checkbox', extra = '') => `<label class="opt">${extra}<input type="${type}" name="${name}" value="${o.id}" data-label="${o[lang]}"><span>${o[lang]}</span></label>`;
  const steps = [t('Servicios', 'Services'), t('Detalles', 'Details'), t('Fecha', 'Date'), t('Tus datos', 'Your details')];
  const body = `
${pageHead(t('Cotizador', 'Quote builder'), t('Arma <em>tu producción</em>', 'Build <em>your production</em>'), t('Cuatro pasos. Al final recibimos tu brief completo y te enviamos una propuesta.', 'Four steps. We receive your full brief and send you a proposal.'))}
<section class="quote wrap" data-quote>
  <form class="quote__form" novalidate>
    <ol class="quote__steps">${steps.map((s, i) => `<li><button type="button" data-goto="${i}"${i === 0 ? ' aria-current="step"' : ''}><b>${i + 1}</b>${s}</button></li>`).join('')}</ol>
    <fieldset data-step="0">
      <legend>${t('¿Qué necesitas? Puedes elegir varios.', 'What do you need? Pick as many as you like.')}</legend>
      <div class="opts opts--big">${services.map((s) => opt('services', { id: s.id, es: s.title.es, en: s.title.en }, 'checkbox', `<img src="${src(s.image, 480)}" alt="" loading="lazy">`)).join('')}</div>
    </fieldset>
    <fieldset data-step="1" hidden>
      <legend>${t('Formato', 'Format')}</legend><div class="opts">${quoteOptions.format.map((o) => opt('format', o, 'radio')).join('')}</div>
      <p class="legend">${t('Duración del rodaje', 'Shoot duration')}</p><div class="opts">${quoteOptions.duration.map((o) => opt('duration', o, 'radio')).join('')}</div>
      <p class="legend">${t('Entregables', 'Deliverables')}</p><div class="opts">${quoteOptions.deliverables.map((o) => opt('deliverables', o)).join('')}</div>
      <div class="field"><input id="q-loc" name="location" placeholder=" " maxlength="200"><label for="q-loc">${t('Lugar del proyecto', 'Project location')}</label></div>
    </fieldset>
    <fieldset data-step="2" hidden>
      <legend>${t('¿Para cuándo?', 'When is it?')}</legend>
      <div class="cal" data-calendar></div>
      <label class="check"><input type="checkbox" name="flexible"> <span>${t('Todavía no tengo fecha definida', 'I don’t have a set date yet')}</span></label>
      <p class="legend">${t('Presupuesto estimado', 'Estimated budget')}</p><div class="opts">${quoteOptions.budget.map((o) => opt('budget', o, 'radio')).join('')}</div>
    </fieldset>
    <fieldset data-step="3" hidden>
      <legend>${t('¿Dónde te enviamos la propuesta?', 'Where should we send the proposal?')}</legend>
      <div class="form">
        <div class="field"><input id="q-name" name="name" required autocomplete="name" placeholder=" " maxlength="100"><label for="q-name">${t('Nombre', 'Name')} *</label></div>
        <div class="field"><input id="q-email" name="email" type="email" required autocomplete="email" placeholder=" " maxlength="160"><label for="q-email">Email *</label></div>
        <div class="field"><input id="q-phone" name="phone" type="tel" autocomplete="tel" placeholder=" " maxlength="40"><label for="q-phone">${t('Teléfono', 'Phone')}</label></div>
        <div class="field"><input id="q-company" name="company" autocomplete="organization" placeholder=" " maxlength="120"><label for="q-company">${t('Empresa o marca', 'Company or brand')}</label></div>
        <div class="field field--full"><textarea id="q-msg" name="message" rows="4" placeholder=" " maxlength="4000"></textarea><label for="q-msg">${t('Cuéntanos más (opcional)', 'Tell us more (optional)')}</label></div>
        <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
        <label class="check field--full"><input type="checkbox" name="consent" required> <span>${t('Acepto que FUCO use estos datos para responderme.', 'I agree FUCO may use these details to reply to me.')} <a href="${url('/privacidad/')}">${t('Privacidad', 'Privacy')}</a></span></label>
      </div>
    </fieldset>
    <p class="form__error" role="alert" hidden></p>
    <div class="quote__nav"><button type="button" class="btn" data-back hidden>← ${t('Atrás', 'Back')}</button><button type="button" class="btn btn--solid" data-next>${t('Continuar', 'Continue')} →</button><button type="submit" class="btn btn--solid" data-send hidden>${t('Enviar solicitud', 'Send request')} ${icons.arrow}</button></div>
  </form>
  <aside class="slate" aria-live="polite">
    <div class="slate__clap"><i></i></div>
    <div class="slate__head"><span>PROD.<b>FUCO</b></span><span>${t('TOMA', 'TAKE')}<b data-take>1</b></span></div>
    <dl data-summary></dl>
    <div class="slate__refs" data-refs></div>
    <p class="slate__price" data-price hidden></p>
    <a class="btn btn--sm" data-wa target="_blank" rel="noopener" href="https://wa.me/${site.whatsapp}">${icons.whatsapp} ${t('Enviar por WhatsApp', 'Send via WhatsApp')}</a>
  </aside>
  <div class="form__done" data-done hidden><i>✓</i><h2>${t('¡Corte! Solicitud recibida', 'Cut! Request received')}</h2><p>${t('Tu número de referencia es', 'Your reference number is')} <b data-ref></b>. ${t('Te escribiremos a', 'We will write to')} <b data-ref-email></b>.</p><a class="btn" href="${url('/proyectos/')}">${t('Seguir mirando proyectos', 'Keep browsing')}</a></div>
</section>`;
  return layout(lang, { path: '/cotizar/', page: 'quote', title: t('Cotizar', 'Get a quote'), body, scripts: ['quote'] });
}

export function clientPage(lang) {
  const c = ctx(lang);
  const { t, url } = c;
  const body = `<section class="client" data-client>
  <div class="client__gate wrap" data-gate>
    <p class="eyebrow">${t('Acceso clientes', 'Client access')}</p>
    <h1 class="display">${t('Tu galería <em>privada</em>', 'Your private <em>gallery</em>')}</h1>
    <p class="lead">${t('Ingresa el código que te enviamos para ver tus fotos, marcar favoritas y descargarlas.', 'Enter the code we sent you to view your photos, pick favourites and download them.')}</p>
    <form data-gate-form><input name="code" required placeholder="${t('CÓDIGO', 'CODE')}" aria-label="${t('Código de galería', 'Gallery code')}" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="40"><button class="btn btn--solid">${t('Entrar', 'Enter')} ${icons.arrow}</button></form>
    <p class="form__error" role="alert" hidden></p>
    <p class="client__help">${t('¿No tienes tu código?', 'Lost your code?')} <a href="${url('/contacto/')}">${t('Escríbenos', 'Contact us')}</a></p>
  </div>
  <div class="client__view" data-view-gallery hidden>
    <header class="wrap"><div><p class="eyebrow" data-g-client></p><h2 data-g-title></h2></div>
      <div class="client__bar"><button type="button" class="chip" data-g-filter="all" aria-pressed="true">${t('Todas', 'All')} <sup data-g-total></sup></button><button type="button" class="chip" data-g-filter="fav" aria-pressed="false">${t('Favoritas', 'Favourites')} <sup data-g-favs>0</sup></button><a class="btn btn--sm" data-g-zip-all>${t('Descargar todo', 'Download all')}</a><a class="btn btn--sm" data-g-zip-fav>${t('Descargar favoritas', 'Download favourites')}</a><button type="button" class="btn btn--sm" data-g-exit>${t('Salir', 'Exit')}</button></div></header>
    <div class="client__grid wrap" data-g-grid></div>
    <form class="client__send wrap" data-g-send><div class="field"><textarea id="g-comment" name="comment" rows="3" placeholder=" " maxlength="2000"></textarea><label for="g-comment">${t('Comentarios sobre tu selección (retoques, formatos…)', 'Notes about your selection (retouching, formats…)')}</label></div><button class="btn btn--solid">${t('Enviar mi selección a FUCO', 'Send my selection to FUCO')}</button></form>
  </div>
</section>`;
  return layout(lang, { path: '/clientes/', page: 'client', title: t('Acceso clientes', 'Client access'), body, scripts: ['client'], noindex: true });
}

export function adminPage() {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Panel — FUCO Estudio</title><link rel="icon" href="/media/brand/favicon-32.png"><link rel="stylesheet" href="/css/main.css?v=__V__"></head>
<body data-page="admin"><div id="admin" class="admin"></div><div class="toast" role="status" aria-live="polite"></div><script type="module" src="/js/admin.js?v=__V__"></script></body></html>`;
}
