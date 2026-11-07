'use strict';
/**
 * Email — Resend if RESEND_API_KEY is set, else SMTP (nodemailer),
 * else a clear console log fallback (dev only — never launch like this).
 * Every email includes an unsubscribe link.
 */
const { config } = require('./config');
const { strings } = require('./i18n');

function unsubscribeUrl(email) {
  return `${config.baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`;
}

async function sendViaResend(to, subject, html) {
  const { Resend } = require('resend');
  const resend = new Resend(config.resendApiKey);
  const { error } = await resend.emails.send({
    from: config.resendFrom, to, subject, html,
  });
  if (error) throw new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
  return { provider: 'resend' };
}

async function sendViaSmtp(to, subject, html) {
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: config.smtp.host, port: config.smtp.port, secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  await transporter.sendMail({ from: config.smtp.from, to, subject, html });
  return { provider: 'smtp' };
}

async function sendEmail(to, subject, html) {
  if (config.resendApiKey) return sendViaResend(to, subject, html);
  if (config.smtp.host) return sendViaSmtp(to, subject, html);
  // Dev fallback — loudly visible, so nobody mistakes it for real sending.
  console.log('=== EMAIL NOT SENT (no RESEND_API_KEY / SMTP configured) ===');
  console.log(`To: ${to}\nSubject: ${subject}\n${html.slice(0, 2000)}`);
  console.log('=== END EMAIL (dev fallback) ===');
  return { provider: 'log-fallback', sent: false };
}

function reportHtml(reading, lang = 'en') {
  const s = strings(lang);
  const esc = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const sec = (title, body) => `<h2>${esc(title)}</h2><p>${esc(body)}</p>`;
  return `<!doctype html><html><body style="font-family:sans-serif;line-height:1.6;max-width:640px;margin:auto;padding:24px">
<h1>FateWeave 天機匯 — Your detailed report</h1>
<p>${esc(s.tagline)}</p>
${sec('Bazi 八字', `${reading.bazi.dayMaster.en} (${reading.bazi.dayMaster.zh}) — ${reading.bazi.guidance.en}`)}
${sec('Zi Wei 紫微', `${reading.ziwei.lifePalace} — ${reading.ziwei.guidance.en}`)}
${sec('Horoscope 星座', `${reading.horoscope.sunSign.en} — ${reading.horoscope.guidance.en}`)}
${sec('Numerology 生命靈數', `Life Path ${reading.numerology.lifePath} — ${reading.numerology.guidance.en}`)}
${sec('Yi-Jing 易經', `${reading.yijing.hexagram} — ${reading.yijing.guidance.en}`)}
${sec('Tarot 塔羅', reading.tarot.guidance.en)}
<h2>Complete Portrait</h2><p>${esc(reading.portrait.essenceLine.en)}</p>
<p><em>${esc(reading.synthesis.en)}</em></p>
<hr><p><small>${reading.limits.join(' ')}</small></p>
</body></html>`;
}

async function sendReportEmail(email, reading, lang = 'en') {
  const subject = lang === 'zh'
    ? 'FateWeave 天機匯 — 你的詳細報告'
    : 'FateWeave — your detailed report';
  const html = reportHtml(reading, lang)
    + `<p><small>Free daily encouragement at 7:00am SGT is on. `
    + `<a href="${unsubscribeUrl(email)}">Unsubscribe</a></small></p>`;
  return sendEmail(email, subject, html);
}

async function sendDailyEmail(email, name, reading, encouragement, lang = 'en') {
  const subject = lang === 'zh' ? 'FateWeave — 今日一句鼓勵' : 'FateWeave — a word for today';
  const html = `<p>Hi ${name ? String(name).replace(/</g, '&lt;') : 'there'},</p>`
    + `<p><strong>${encouragement.en}</strong><br>${encouragement.zh}</p>`
    + (reading ? `<p>${reading.portrait.essenceLine.en}</p>` : '')
    + `<p><small><a href="${unsubscribeUrl(email)}">Unsubscribe</a> — daily encouragement, 7:00am SGT.</small></p>`;
  return sendEmail(email, subject, html);
}

module.exports = { sendEmail, sendReportEmail, sendDailyEmail, unsubscribeUrl };
