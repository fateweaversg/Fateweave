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
  const L = (o) => (o && typeof o === 'object' ? (lang === 'zh' ? o.zh || o.en : o.en || o.zh) : o);
  const sec = (title, body) => `<h2>${esc(title)}</h2><p>${esc(body)}</p>`;
  const sub = (title, body) => `<h3>${esc(title)}</h3><p>${esc(body)}</p>`;
  const subSecs = (sections) => {
    if (!sections) return '';
    const order = ['overview', 'strengths', 'challenges', 'career', 'relationships', 'health', 'timing'];
    let html = '';
    for (const key of order) {
      if (sections[key]) html += sub(key[0].toUpperCase() + key.slice(1), L(sections[key]));
    }
    return html;
  };
  let html = `<!doctype html><html><body style="font-family:sans-serif;line-height:1.6;max-width:640px;margin:auto;padding:24px">
<h1>FateWeave 天機匯 — Your detailed report</h1>
<p>${esc(s.tagline)}</p>
<p><small>Birth date: ${esc(reading.profile.birthDate)}${reading.profile.name ? ` · ${esc(reading.profile.name)}` : ''}</small></p>`;

  html += `<h2>Bazi 八字 — ${esc(L(reading.bazi.dayMaster))} (${esc(reading.bazi.dayMaster.zh)})</h2>`;
  html += `<p>Four pillars: ${reading.bazi.pillars.map((p) => `${esc(L(p.label))} ${esc(p.stem.char)}${esc(p.branch.char)}`).join(' · ')}</p>`;
  html += subSecs(reading.bazi.sections);

  html += `<h2>Zi Wei 紫微 — ${esc(reading.ziwei.lifePalace)}</h2><p><em>${esc(reading.ziwei.note)}</em></p>`;
  html += reading.ziwei.palaces.map((p) => `<p><strong>${esc(L(p))} ${esc(p.star)}:</strong> ${esc(L(p.text))}</p>`).join('');
  html += subSecs(reading.ziwei.sections);

  html += `<h2>Horoscope 星座 — ${esc(L(reading.horoscope.sun))}</h2>`;
  html += `<p>Sun ${esc(L(reading.horoscope.sun))} · Moon ${esc(L(reading.horoscope.moon))} · Rising ${esc(L(reading.horoscope.rising))}</p>`;
  html += subSecs(reading.horoscope.sections);

  html += `<h2>Numerology 生命靈數 — Life Path ${reading.numerology.lifePath}</h2>`;
  html += subSecs(reading.numerology.sections);

  html += `<h2>Yi-Jing 易經 — ${esc(reading.yijing.hexagram)}</h2>`;
  html += `<p>${esc(L(reading.yijing.theme))}</p>`;
  html += subSecs(reading.yijing.sections);
  if (reading.yijing.transformed) html += `<p>Transformed hexagram: ${esc(reading.yijing.transformed.number)} · ${esc(reading.yijing.transformed.en)} (${esc(reading.yijing.transformed.zh)})</p>`;

  html += `<h2>Tarot 塔羅</h2>`;
  html += reading.tarot.cardsDetailed.map((c) => `<p><strong>${esc(L(c.position))} — ${esc(c.name.en)}${c.reversed ? ' (Reversed)' : ''}:</strong> ${esc(L(c.meaning))}</p>`).join('');
  html += `<p>${esc(L(reading.tarot.story))}</p>`;
  html += subSecs(reading.tarot.sections);

  if (reading.personality) {
    html += `<h2>Personality 人格</h2>`;
    if (reading.personality.enneagram) html += `<p><strong>Enneagram ${reading.personality.enneagram.core}w${reading.personality.enneagram.wing} · ${esc(reading.personality.enneagram.nameEn)}:</strong> ${esc(L(reading.personality.enneagram.summary))}</p>`;
    if (reading.personality.mbti) html += `<p><strong>MBTI ${reading.personality.mbti.type} · ${esc(reading.personality.mbti.nickEn)}:</strong> ${esc(L(reading.personality.mbti.summary))}</p>`;
  }

  html += `<h2>Complete Portrait</h2><p>${esc(L(reading.portrait.essenceLine))}</p>`;
  html += `<p>${esc(L(reading.portrait.character))}</p>`;
  html += `<h3>Strengths</h3><ul>${reading.portrait.strengths.map((x) => `<li>${esc(L(x.text))} <small>(${esc(L(x.source))})</small></li>`).join('')}</ul>`;
  html += `<h3>What's lacking</h3><ul>${reading.portrait.lacking.map((x) => `<li>${esc(L(x.text))} <small>(${esc(L(x.source))})</small></li>`).join('')}</ul>`;
  html += `<p><em>${esc(L(reading.synthesis.full))}</em></p>`;
  html += `<hr><p><small>${reading.limits.join(' ')}</small></p></body></html>`;
  return html;
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
