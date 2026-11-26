import { $, $$, t, api } from './util.js';

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

export async function sendLead(payload) {
  try {
    return await api('/api/leads', { method: 'POST', body: payload });
  } catch (err) {
    if (err.status === 429) throw new Error(t('Recibimos varios envíos seguidos. Intenta de nuevo en unos minutos.', 'Too many submissions in a row. Please try again in a few minutes.'));
    throw new Error(t('No pudimos enviar el formulario. Intenta otra vez o escríbenos por WhatsApp o correo.', 'We could not send the form. Please try again or reach us by WhatsApp or email.'));
  }
}
