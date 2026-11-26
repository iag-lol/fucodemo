// Avisos de nuevas solicitudes. Opcional: se activa con variables de entorno (ver .env.example).
export async function notify(lead) {
  const { RESEND_API_KEY, MAIL_TO, MAIL_FROM, LEAD_WEBHOOK_URL } = process.env;
  const lines = [`Referencia: ${lead.ref}`, `Tipo: ${lead.type}`, `Nombre: ${lead.name}`, `Email: ${lead.email || '—'}`, `Teléfono: ${lead.phone || '—'}`, `Empresa: ${lead.company || '—'}`, '', lead.message || '',
    '', ...Object.entries(lead.data ?? {}).filter(([, v]) => v?.length).map(([k, v]) => `${k}: ${[v].flat().join(', ')}`)];
  const send = async (url, headers, body) => {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(10_000) });
      if (!res.ok) console.error(`Aviso no enviado (${lead.ref}): HTTP ${res.status}`);
    } catch (err) { console.error(`Aviso no enviado (${lead.ref}): ${err.message}`); }
  };
  if (RESEND_API_KEY && MAIL_TO && MAIL_FROM) {
    await send('https://api.resend.com/emails', { Authorization: `Bearer ${RESEND_API_KEY}` },
      { from: MAIL_FROM, to: MAIL_TO.split(','), reply_to: lead.email || undefined, subject: `Nueva solicitud ${lead.ref} — ${lead.name}`, text: lines.join('\n') });
  }
  if (LEAD_WEBHOOK_URL) await send(LEAD_WEBHOOK_URL, {}, lead);
}
