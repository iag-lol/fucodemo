// Formulario de contacto.
import { $, t, lang } from './lib/util.js';
import { validate, showError, sendLead } from './lib/forms.js';

const form = $('[data-lead-form]');
const done = $('[data-done]');
const error = $('.form__error', form);
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError(error);
  if (!validate(form)) return showError(error, t('Revisa los campos marcados.', 'Check the highlighted fields.'));
  const button = $('[type="submit"]', form);
  button.disabled = true;
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await sendLead({ ...data, type: form.dataset.leadForm, consent: true, lang });
    form.hidden = true;
    done.hidden = false;
    $('[data-ref]', done).textContent = res.ref;
    done.scrollIntoView({ block: 'center' });
  } catch (err) {
    showError(error, err.message);
  } finally {
    button.disabled = false;
  }
});
