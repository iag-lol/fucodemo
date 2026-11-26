import { $, $$, t, api, isStatic } from './util.js';

/** Marca los campos inválidos y devuelve true si todo está correcto. */
export function validate(scope) {
  let first;
  for (const input of $$('input[required], textarea[required], input[type="email"]', scope)) {
    const ok = input.checkValidity() && (input.type === 'checkbox' || !input.required || input.value.trim() !== '')
      && (input.type !== 'email' || !input.value || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim()));
    (input.closest('.field') ?? input.closest('.check'))?.classList.toggle('is-invalid', !ok);
    input.setAttribute('aria-invalid', !ok);
    if (!ok) first ??= input;
  }
  first?.focus();
  return !first;
}
document.addEventListener('input', (e) => {
  e.target.closest?.('.is-invalid')?.classList.remove('is-invalid');
  e.target.removeAttribute?.('aria-invalid');
});

export function showError(node, message) {
  node.textContent = message ?? '';
  node.hidden = !message;
}

/** Sin servidor: deja el mensaje escrito en los botones de WhatsApp y correo, y abre WhatsApp. */
function handOff({ name, email, phone, company, message }, rows) {
  const line = (label, value) => value && `${label}: ${value}`;
  const text = [
    t('Hola FUCO, les escribo desde la web.', 'Hi FUCO, I am writing from your website.'), '',
    line(t('Nombre', 'Name'), name), line('Email', email), line(t('Teléfono', 'Phone'), phone), line(t('Empresa', 'Company'), company),
    ...rows.map(([label, value]) => line(label, value)),
    message && `\n${message}`,
  ].filter((x) => typeof x === 'string').join('\n');
  const wa = $('[data-send-wa]'), mail = $('[data-send-mail]');
  wa.href = `${wa.href.split('?')[0]}?text=${encodeURIComponent(text)}`;
  const subject = `${t('Consulta web', 'Website enquiry')} — ${name.trim()}`;
  mail.href = `${mail.href.split('?')[0]}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  window.open(wa.href, '_blank', 'noopener');
}

/** Muestra la pantalla final y, en el sitio estático, permite volver a editar. */
export function finish(done, hide) {
  hide.forEach((x) => { x.hidden = true; });
  done.hidden = false;
  const edit = $('[data-edit]', done);
  if (edit) edit.onclick = () => { done.hidden = true; hide.forEach((x) => { x.hidden = false; }); };
  done.scrollIntoView({ block: 'center' });
}

export async function sendLead(payload, rows = []) {
  if (isStatic) { handOff(payload, rows); return null; }
  try {
    return await api('/api/leads', { method: 'POST', body: payload });
  } catch (err) {
    if (err.status === 429) throw new Error(t('Recibimos varios envíos seguidos. Intenta de nuevo en unos minutos.', 'Too many submissions in a row. Please try again in a few minutes.'));
    throw new Error(t('No pudimos enviar el formulario. Intenta otra vez o escríbenos por WhatsApp o correo.', 'We could not send the form. Please try again or reach us by WhatsApp or email.'));
  }
}
