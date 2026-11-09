'use strict';
/**
 * Email — configured SMTP first, then Resend, else a clear console log
 * fallback in development only. Production fails closed without a provider.
 * Every email includes an unsubscribe link.
 */
const { config } = require('./config');
const { strings } = require('./i18n');

function unsubscribeUrl(email) {
  return `${config.baseUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`;
}

// Classify the known Resend sandbox restriction so the page can explain
// the failure and point the buyer to the already-unlocked download.
function classifyResendError(error) {
  const msg = String((error && error.message) || '');
  const status = error && (error.statusCode || error.status);
  if (/only send testing emails to your own email address/i.test(msg)) return 'resend_sandbox_recipient';
  if (status === 403 && /testing email/i.test(msg)) return 'resend_sandbox_recipient';
  return 'resend_error';
}

async function sendViaResend(to, subject, html) {
  const { Resend } = require('resend');
  const resend = new Resend(config.resendApiKey);
  const { error } = await resend.emails.send({
    from: config.resendFrom, to, subject, html,
  });
  if (error) {
    const e = new Error(`Resend error: ${error.message || JSON.stringify(error)}`);
    e.code = classifyResendError(error);
    e.resendStatus = error.statusCode || error.status || null;
    throw e;
  }
  return { provider: 'resend' };
}

async function sendViaSmtp(to, subject, html) {
  const nodemailer = require('nodemailer');
  // Google displays App Passwords in four-character groups. Users may paste
  // those display spaces into Railway; Gmail expects the compact 16-character
  // value. Leave other SMTP providers' passwords untouched.
  const pass = /(^|\.)gmail\.com$/i.test(config.smtp.host)
    ? config.smtp.pass.replace(/\s+/g, '')
    : config.smtp.pass;
  const transporter = nodemailer.createTransport({
    host: config.smtp.host, port: config.smtp.port, secure: config.smtp.port === 465, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    auth: { user: config.smtp.user, pass },
  });
  try {
    await transporter.sendMail({ from: config.smtp.from, to, subject, html });
  } catch (err) {
    const response = String(err && err.response || '');
    if ((err && err.code === 'EAUTH') || /535|5\.7\.8|authentication/i.test(response)) {
      err.code = 'smtp_auth_error';
    } else if (['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNREFUSED'].includes(err && err.code)) {
      err.code = 'smtp_connection_error';
    } else if (!err.code || err.code === 'EAUTH') {
      err.code = 'smtp_error';
    }
    throw err;
  }
  return { provider: 'smtp' };
}

async function sendEmail(to, subject, html) {
  // Test hook (smoke test only): EMAIL_FAIL_MODE=resend-sandbox makes
  // sendEmail fail exactly the way Resend's sandbox sender fails for a
  // non-owner recipient, so /api/resend-report's specific error can be
  // tested without a live Resend key or network call. Never set in prod.
  if (process.env.EMAIL_FAIL_MODE === 'resend-sandbox') {
    const e = new Error('Resend error: You can only send testing emails to your own email address');
    e.code = 'resend_sandbox_recipient';
    e.resendStatus = 403;
    throw e;
  }
  // Prefer the configured Gmail SMTP route so the app can send from the
  // existing mailbox without owning a custom domain. Resend remains a
  // fallback only when SMTP is not configured.
  if (config.smtp.host) {
    if (!config.smtp.user || !config.smtp.pass) {
      const e = new Error('SMTP is selected but SMTP_USER or SMTP_PASS is missing.');
      e.code = 'smtp_config_error';
      throw e;
    }
    return sendViaSmtp(to, subject, html);
  }
  if (config.resendApiKey) return sendViaResend(to, subject, html);
  // Dev fallback — loudly visible, so nobody mistakes it for real sending.
  if (config.nodeEnv === 'production') {
    const e = new Error('No SMTP or Resend email provider is configured.');
    e.code = 'email_provider_not_configured';
    throw e;
  }
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
  // Section headings must follow the email language — the old version used
  // the English key names ("Overview", "Career"...) even in Chinese mail.
  const SEC_TITLES = {
    overview: { en: 'Overview', zh: '总览' }, strengths: { en: 'Strengths', zh: '长处' },
    challenges: { en: 'Challenges', zh: '挑战' }, career: { en: 'Career', zh: '事业' },
    relationships: { en: 'Relationships', zh: '感情与关系' }, health: { en: 'Health & energy', zh: '健康与精力' },
    timing: { en: 'Timing', zh: '时机' },
  };
  // Honest limits, localised — the old version printed reading.limits,
  // which are English-only strings from the server, in both languages.
  const LIMITS = lang === 'zh'
    ? ['八字为简化演示引擎，尚未做真太阳时校正。', '紫微根据出生日期、出生时间及排盘性别计算，使用输入的钟表时间，未作真太阳时地点校正。', '月亮与上升星座为原型的近似计算。', '仅供自我反思与娱乐——不是医疗、财务或法律建议。']
    : ['Bazi simplified engine, no true solar-time correction yet.', 'Zi Wei is calculated from birth date, birth time and chart sex, using entered clock time without a true-solar-time location correction.', 'Moon / Rising are approximations from the original prototype.', 'Self-reflection / entertainment only — no medical, financial or legal claims.'];
  const subSecs = (sections) => {
    if (!sections) return '';
    const order = ['overview', 'strengths', 'challenges', 'career', 'relationships', 'health', 'timing'];
    let html = '';
    for (const key of order) {
      if (sections[key]) html += sub(L(SEC_TITLES[key]), L(sections[key]));
    }
    return html;
  };
  let html = `<!doctype html><html><body style="font-family:sans-serif;line-height:1.6;max-width:640px;margin:auto;padding:24px">
<h1>FateWeave 天机汇 — ${lang === 'zh' ? '你的详细报告' : 'Your detailed report'}</h1>
<p>${esc(s.tagline)}</p>
<p><small>${lang === 'zh' ? '出生日期' : 'Birth date'}: ${esc(reading.profile.birthDate)}${reading.profile.name ? ` · ${esc(reading.profile.name)}` : ''}${reading.generatedAt ? ` · ${lang === 'zh' ? '生成于' : 'Generated'} ${esc(reading.generatedAt.slice(0, 10))}` : ''}</small></p>`;

  html += `<h2>Bazi 八字 — ${esc(L(reading.bazi.dayMaster))} (${esc(reading.bazi.dayMaster.zh)})</h2>`;
  html += `<p>Four pillars: ${reading.bazi.pillars.map((p) => `${esc(L(p.label))} ${esc(p.stem.char)}${esc(p.branch.char)}`).join(' · ')}</p>`;
  html += subSecs(reading.bazi.sections);

  html += `<h2>Zi Wei 紫微 — ${esc(reading.ziwei.lifePalace)}</h2><p><em>${esc(reading.ziwei.note)}</em></p>`;
  html += reading.ziwei.palaces.map((p) => {
    const majors = (p.majorStars || []).map(L).join(' · ') || L(p.star);
    const minors = (p.minorStars || []).map(L).join(' · ');
    const cycle = p.decadal ? `${p.decadal.startAge}–${p.decadal.endAge}` : '';
    const ageLabel = lang === 'zh' ? '大限年龄' : 'Decadal ages';
    const bodyLabel = p.isBodyPalace ? (lang === 'zh' ? ' · 身宫' : ' · Body Palace') : '';
    return `<p><strong>${esc(L(p))} (${esc(L(p.branch))})${bodyLabel} — ${esc(majors)}</strong>${minors ? `<br>${lang === 'zh' ? '辅曜' : 'Supporting stars'}: ${esc(minors)}` : ''}${cycle ? `<br>${ageLabel}: ${esc(cycle)}` : ''}<br>${esc(L(p.text))}</p>`;
  }).join('');
  html += subSecs(reading.ziwei.sections);

  html += `<h2>Horoscope 星座 — ${esc(L(reading.horoscope.sun))}</h2>`;
  html += `<p>Sun ${esc(L(reading.horoscope.sun))} · Moon ${esc(L(reading.horoscope.moon))} · Rising ${esc(L(reading.horoscope.rising))}</p>`;
  html += subSecs(reading.horoscope.sections);

  html += `<h2>Numerology 生命灵数 — Life Path ${reading.numerology.lifePath}</h2>`;
  html += subSecs(reading.numerology.sections);

  html += `<h2>Yi-Jing 易经 — ${esc(reading.yijing.hexagram)}</h2>`;
  html += `<p>${esc(L(reading.yijing.theme))}</p>`;
  html += subSecs(reading.yijing.sections);
  if (reading.yijing.transformed) html += `<p>Transformed hexagram: ${esc(reading.yijing.transformed.number)} · ${esc(reading.yijing.transformed.en)} (${esc(reading.yijing.transformed.zh)})</p>`;

  html += `<h2>Tarot 塔罗</h2>`;
  html += reading.tarot.cardsDetailed.map((c) => `<p><strong>${esc(L(c.position))} — ${esc(L(c.name))}${c.reversed ? (lang === 'zh' ? '（逆位）' : ' (Reversed)') : ''}:</strong> ${esc(L(c.meaning))}</p>`).join('');
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
  html += `<hr><p><small>${LIMITS.join(' ')}</small></p></body></html>`;
  return html;
}

async function sendReportEmail(email, reading, lang = 'en') {
  const subject = lang === 'zh'
    ? 'FateWeave 天机汇 — 你的详细报告'
    : 'FateWeave — your detailed report';
  const html = reportHtml(reading, lang)
    + `<p><small>Free daily encouragement at 7:00am SGT is on. `
    + `<a href="${unsubscribeUrl(email)}">Unsubscribe</a></small></p>`;
  return sendEmail(email, subject, html);
}

// Daily mail (item F, 7 Nov 2026): `daily` is the message generated for
// TODAY from THIS buyer's own birth profile (buildDailyMessage in
// readings.js) — today's seeded tarot card and hexagram plus the profile's
// own Day Master / elements / Life Path. No generic rotated line.
async function sendDailyEmail(email, name, daily, lang = 'en') {
  const subject = lang === 'zh' ? 'FateWeave — 今日一句鼓励' : 'FateWeave — a word for today';
  const html = `<p>Hi ${name ? String(name).replace(/</g, '&lt;') : 'there'},</p>`
    + `<p><strong>${daily.en}</strong><br>${daily.zh}</p>`
    + (daily.card ? `<p>${lang === 'zh' ? '今日塔罗' : "Today's tarot"}: ${daily.card.name.en} ${daily.card.emoji} · ${daily.card.name.zh} — ${lang === 'zh' ? '今日卦象' : "Today's hexagram"}: ${daily.hexagram.number} · ${daily.hexagram.en} (${daily.hexagram.zh})</p>` : '')
    + `<p><small><a href="${unsubscribeUrl(email)}">Unsubscribe</a> — daily encouragement, 7:00am SGT.</small></p>`;
  return sendEmail(email, subject, html);
}

module.exports = { sendEmail, sendReportEmail, sendDailyEmail, unsubscribeUrl, classifyResendError };
