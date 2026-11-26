import { layout } from './layout.mjs';
import { ctx, esc, img, src, icons, bySlug, STATIC } from './helpers.mjs';
import { pageHead, handOffDone } from './components.mjs';
import { services, faqs } from '../data/content.mjs';
import { site } from '../data/site.mjs';

export function servicesPage(lang) {
  const c = ctx(lang);
  const { t, L, url } = c;
  const body = `
${pageHead(t('Servicios', 'Services'), t('Foto y video <em>para cada pantalla</em>', 'Photo and video <em>for every screen</em>'), t('Un solo equipo desde la idea hasta la entrega. Combina lo que necesites y arma tu cotización.', 'One crew from idea to delivery. Mix what you need and build your quote.'))}
<nav class="subnav wrap" aria-label="${t('Servicios', 'Services')}">${services.map((s) => `<a class="chip" href="#${s.id}">${L(s.title)}</a>`).join('')}</nav>
${services.map((s, i) => `<section class="service wrap ${i % 2 ? 'service--alt' : ''}" id="${s.id}">
  <div class="service__media" data-parallax>${img(s.image, { sizes: '(max-width: 900px) 100vw, 50vw', alt: L(s.title) })}</div>
  <div class="service__text">
    <b data-reveal>${s.n}</b><h2 data-reveal>${L(s.title)}</h2><p class="lead" data-reveal>${L(s.text)}</p>
    <ul class="ticks" data-reveal>${L(s.items).map((x) => `<li>${x}</li>`).join('')}</ul>
    <div class="service__rel" data-reveal>${s.related.map((slug) => bySlug[slug]).map((p) => `<a href="${url(`/proyectos/${p.slug}/`)}"><img src="${src(p.cover, 480)}" alt="" loading="lazy"><span>${esc(p.client)}</span></a>`).join('')}</div>
    <a class="btn btn--solid" data-reveal href="${url(`/cotizar/?servicio=${s.id}`)}">${t('Cotizar', 'Get a quote')} ${icons.arrow}</a>
  </div>
</section>`).join('')}
<section class="faq wrap">
  <div class="shead"><p class="eyebrow">FAQ</p><h2>${t('Preguntas', 'Frequent')} <em>${t('frecuentes', 'questions')}</em></h2></div>
  <div>${faqs.map((f) => `<details data-reveal><summary>${L(f.q)}<i></i></summary><p>${L(f.a)}</p></details>`).join('')}</div>
</section>`;
  const jsonld = [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: L(f.q), acceptedAnswer: { '@type': 'Answer', text: L(f.a) } })) }];
  return layout(lang, { path: '/servicios/', page: 'services', title: t('Servicios', 'Services'), body, jsonld });
}

export function contactPage(lang) {
  const c = ctx(lang);
  const { t, url } = c;
  const body = `
${pageHead(t('Contacto', 'Contact'), t('Cuéntanos <em>tu idea</em>', 'Tell us <em>your idea</em>'), STATIC
  ? t('Escribe tu mensaje y envíalo por WhatsApp o correo. Si prefieres detallar servicios y fecha, usa el cotizador.', 'Write your message and send it by WhatsApp or email. To detail services and date, use the quote builder.')
  : t('Escríbenos y te respondemos por correo. Si prefieres detallar servicios y fecha, usa el cotizador.', 'Write to us and we will reply by email. To detail services and date, use the quote builder.'))}
<section class="contact wrap">
  <form class="form" data-lead-form="contacto" novalidate>
    <div class="field"><input id="f-name" name="name" required autocomplete="name" placeholder=" " maxlength="100"><label for="f-name">${t('Nombre', 'Name')} *</label></div>
    <div class="field"><input id="f-email" name="email" type="email" required autocomplete="email" placeholder=" " maxlength="160"><label for="f-email">Email *</label></div>
    <div class="field"><input id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder=" " maxlength="40"><label for="f-phone">${t('Teléfono', 'Phone')}</label></div>
    <div class="field"><input id="f-company" name="company" autocomplete="organization" placeholder=" " maxlength="120"><label for="f-company">${t('Empresa o marca', 'Company or brand')}</label></div>
    <div class="field field--full"><textarea id="f-msg" name="message" required rows="5" placeholder=" " maxlength="4000"></textarea><label for="f-msg">${t('Mensaje', 'Message')} *</label></div>
    <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label class="check field--full"><input type="checkbox" name="consent" required> <span>${t('Acepto que FUCO use estos datos para responderme.', 'I agree FUCO may use these details to reply to me.')} <a href="${url('/privacidad/')}">${t('Privacidad', 'Privacy')}</a></span></label>
    <p class="form__error field--full" role="alert" hidden></p>
    <button class="btn btn--solid field--full" type="submit">${STATIC ? t('Continuar', 'Continue') : t('Enviar mensaje', 'Send message')} ${icons.arrow}</button>
  </form>
  ${STATIC ? handOffDone(c) : `<div class="form__done" data-done hidden><i>✓</i><h2>${t('Mensaje recibido', 'Message received')}</h2><p>${t('Gracias. Tu número de referencia es', 'Thank you. Your reference number is')} <b data-ref></b>.</p><a class="btn" href="${url('/proyectos/')}">${t('Seguir mirando proyectos', 'Keep browsing')}</a></div>`}
  <aside class="contact__aside">
    <a class="cardlink" href="https://wa.me/${site.whatsapp}" target="_blank" rel="noopener">${icons.whatsapp}<span><small>WhatsApp</small>${site.team[0].phone}</span></a>
    <button type="button" class="cardlink" data-copy="${site.email}"><b>@</b><span><small>${t('Correo (clic para copiar)', 'Email (click to copy)')}</small>${site.email}</span></button>
    <a class="cardlink" href="${site.instagram}" target="_blank" rel="noopener">${icons.instagram}<span><small>Instagram</small>${site.instagramHandle}</span></a>
    <div class="where"><small>${t('Base', 'Based in')}</small><strong>${site.city}</strong><p>33.4489° S · 70.6693° W</p><p>${t('Hora local', 'Local time')} <time data-clock="${site.timezone}">--:--:--</time></p></div>
    ${img('paris-parade', { sizes: '(max-width: 900px) 100vw, 33vw', alt: 'Santiago de Chile' })}
  </aside>
</section>`;
  return layout(lang, { path: '/contacto/', page: 'contact', title: t('Contacto', 'Contact'), body, scripts: ['forms'] });
}

export function privacyPage(lang) {
  const c = ctx(lang);
  const { t } = c;
  const sections = [
    [t('Qué datos recibimos', 'What we collect'), STATIC
      ? t('Este sitio no guarda lo que escribes en los formularios: prepara un mensaje que tú decides enviar por WhatsApp o correo. Al enviarlo recibimos los datos que incluya.', 'This site does not store what you type in the forms: it prepares a message that you choose to send by WhatsApp or email. When you send it, we receive the details it contains.')
      : t('Los que escribes en los formularios: nombre, correo, teléfono, empresa, detalles del proyecto y, en las galerías privadas, tus fotos favoritas y comentarios.', 'What you type in our forms: name, email, phone, company, project details and, in private galleries, your favourite photos and comments.')],
    [t('Para qué los usamos', 'How we use them'), t('Únicamente para responder tu solicitud, preparar propuestas y entregar tu material. No los vendemos.', 'Only to answer your request, prepare proposals and deliver your files. We do not sell them.')],
    [t('Cookies y almacenamiento', 'Cookies and storage'), t('Este sitio no usa cookies de publicidad ni analítica. Guarda en tu navegador preferencias como tu moodboard.', 'This site uses no advertising or analytics cookies. It keeps preferences such as your moodboard in your browser.') + (STATIC ? '' : t(' El panel interno usa una cookie de sesión.', ' The internal panel uses a session cookie.'))],
    [t('Tus derechos', 'Your rights'), `${t('Puedes pedir acceso, corrección o eliminación de tus datos escribiendo a', 'You can ask to access, correct or delete your data by writing to')} <a href="mailto:${site.email}">${site.email}</a>.`],
  ];
  const body = `${pageHead('Legal', t('Privacidad', 'Privacy'))}<section class="prose wrap">${sections.map(([h, p]) => `<h2>${h}</h2><p>${p}</p>`).join('')}</section>`;
  return layout(lang, { path: '/privacidad/', page: 'privacy', title: t('Privacidad', 'Privacy'), body });
}

export function notFoundPage(lang) {
  const c = ctx(lang);
  const { t, url } = c;
  const body = `<section class="nf wrap">${img('terrex-01', { cls: 'nf__bg', eager: true })}<div><p class="eyebrow">Error 404</p><h1 class="display">${t('Fuera de <em>foco</em>', 'Out of <em>focus</em>')}</h1><p>${t('La página que buscas no existe o se movió.', 'The page you are looking for does not exist or has moved.')}</p><a class="btn btn--solid" href="${url('/')}">${t('Volver al inicio', 'Back home')}</a> <a class="btn" href="${url('/proyectos/')}">${t('Ver proyectos', 'View work')}</a></div></section>`;
  return layout(lang, { path: '/404/', page: 'notfound', title: '404', body, noindex: true, footer: false });
}
