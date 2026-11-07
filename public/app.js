'use strict';
/* FateWeave frontend — NO secrets, NO unlock codes, NO payment verification here.
   Payment is verified on the server only. The browser only holds the random
   access token the server issued after a verified payment. */
const state = { lang: 'en', teaser: null, price: null, sessionId: crypto.randomUUID() };

const STR = {
  en: {
    tagline: 'One birthday in. Six systems answer. Do they agree?',
    hookTitle: 'Your free glimpse', hookCta: 'See my free glimpse',
    unlockTitle: 'Unlock the full reading',
    unlockBody: 'Pay first, then the full details open — for every system, plus Live Reader (3 questions) and your detailed report by email.',
    liveReaderTitle: 'Live Reader', liveReaderBody: 'Ask up to 3 questions, by voice or typing. Answers are grounded in your reading only.',
    dailyTitle: 'Free daily encouragement', dailyBody: 'One short email at 7:00am SGT — a word of encouragement, a tarot card, and a line for your day. Free with your unlock. Unsubscribe anytime.',
    limitsTitle: 'Honest limits',
  },
  zh: {
    tagline: '輸入一次生日，六個系統同時回答。它們說的一樣嗎？',
    hookTitle: '你的免費一瞥', hookCta: '查看我的免費一瞥',
    unlockTitle: '解鎖完整報告',
    unlockBody: '先付款，完整內容隨即開啟——六個系統全部、Live Reader（3 個問題），以及詳細報告寄到你的信箱。',
    liveReaderTitle: 'Live Reader', liveReaderBody: '最多問 3 個問題，可用語音或打字。回答只根據你的報告內容。',
    dailyTitle: '免費每日鼓勵', dailyBody: '每天早上 7:00（新加坡時間）一封短信——一句鼓勵、一張塔羅牌、一句今日提醒。解鎖後免費，隨時可以取消訂閱。',
    limitsTitle: '誠實說明',
  },
};

function setLang(lang) {
  state.lang = lang;
  document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';
  document.querySelectorAll('[data-i18n]').forEach((el) => { if (STR[lang][el.dataset.i18n]) el.textContent = STR[lang][el.dataset.i18n]; });
  document.getElementById('lang-en').classList.toggle('active', lang === 'en');
  document.getElementById('lang-zh').classList.toggle('active', lang === 'zh');
}
document.getElementById('lang-en').onclick = () => setLang('en');
document.getElementById('lang-zh').onclick = () => setLang('zh');

async function loadPrice() {
  try {
    const res = await fetch('/api/config');
    const data = await res.json();
    state.price = data.price;
    const dollars = (data.price.amountCents / 100).toFixed(2);
    document.getElementById('price-line').textContent = data.price.isPromo
      ? `$${dollars} launch promo · ${data.price.promoStart}–${data.price.promoEnd} · then $8`
      : `$${dollars} full unlock`;
    document.getElementById('pay-btn').textContent = `Pay $${dollars} & unlock`;
  } catch { document.getElementById('price-line').textContent = 'Price unavailable — please try again later.'; }
}

document.getElementById('hook-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const birthDate = document.getElementById('birthDate').value;
  const birthTime = document.getElementById('birthTime').value || null;
  const name = document.getElementById('name').value || null;
  const box = document.getElementById('teaser');
  box.classList.remove('hidden');
  box.textContent = 'Reading your glimpse…';
  try {
    const res = await fetch('/api/hook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ birthDate, birthTime, name }) });
    const t = await res.json();
    if (!res.ok) { box.textContent = t.error || 'Could not read that birth date.'; return; }
    state.teaser = t;
    box.innerHTML = `
      <h3>Free glimpse — full details locked</h3>
      <ul>
        <li><strong>Bazi 八字:</strong> Day Master ${t.bazi.dayMaster} (${t.bazi.dayMasterZh}) — rest locked</li>
        <li><strong>Zi Wei 紫微:</strong> ${t.ziwei.lifePalace} (${t.ziwei.lifePalaceZh}) — rest locked</li>
        <li><strong>Horoscope 星座:</strong> ${t.horoscope.sunSign} (${t.horoscope.sunSignZh}) — rest locked</li>
        <li><strong>Numerology:</strong> Life Path ${t.numerology.lifePath} — rest locked</li>
        <li><strong>Yi-Jing 易經:</strong> ${t.yijing.hexagram} — interpretation locked</li>
        <li><strong>Tarot 塔羅:</strong> ${t.tarot.firstCard} — interpretation locked</li>
      </ul>
      <p><em>${t.portrait.essenceLine.en}</em></p>
      <p>${t.lockedNote.en}</p>`;
  } catch (err) { box.textContent = 'Network error: ' + err.message; }
});

document.getElementById('checkout-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const birthDate = document.getElementById('birthDate').value;
  if (!birthDate) { alert('Enter your birth date in the free glimpse form first.'); return; }
  const birthTime = document.getElementById('birthTime').value || null;
  const name = document.getElementById('name').value || null;
  try {
    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, birthDate, birthTime, name }) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Checkout failed.'); return; }
    location.href = data.checkoutUrl;
  } catch (err) { alert('Checkout error: ' + err.message); }
});

async function loadReport() {
  const token = localStorage.getItem('fateweave_token');
  const email = localStorage.getItem('fateweave_email');
  const birthDate = localStorage.getItem('fateweave_birthDate');
  if (!token || !email || !birthDate) return;
  try {
    const res = await fetch(`/api/report?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&birthDate=${encodeURIComponent(birthDate)}`);
    if (!res.ok) return; // Not paid / expired — stay on the hook view.
    const r = await res.json();
    document.getElementById('report-card').classList.remove('hidden');
    document.getElementById('report').innerHTML = `
      <h3>Bazi 八字 — ${r.bazi.dayMaster.en} (${r.bazi.dayMaster.zh})</h3><p>${r.bazi.guidance.en}</p>
      <h3>Zi Wei 紫微 — ${r.ziwei.lifePalace}</h3><p>${r.ziwei.guidance.en}</p>
      <h3>Horoscope — ${r.horoscope.sunSign.en}</h3><p>${r.horoscope.guidance.en}</p>
      <h3>Numerology — Life Path ${r.numerology.lifePath}</h3><p>${r.numerology.guidance.en}</p>
      <h3>Yi-Jing — ${r.yijing.hexagram}</h3><p>${r.yijing.guidance.en}</p>
      <h3>Tarot — ${r.tarot.cards.join(', ')}</h3><p>${r.tarot.guidance.en}</p>
      <h3>Complete Portrait</h3><p>${r.portrait.essenceLine.en}</p><p>${r.portrait.growingEdge.en}</p>
      <p><em>${r.synthesis.en}</em></p>`;
  } catch { /* stay on hook view */ }
}

// Live Reader — voice in (SpeechRecognition) + voice out (speechSynthesis), typed fallback.
document.getElementById('lr-ask').addEventListener('click', async () => {
  const q = document.getElementById('lr-question').value.trim();
  if (!q) return;
  const token = localStorage.getItem('fateweave_token');
  const email = localStorage.getItem('fateweave_email');
  const birthDate = localStorage.getItem('fateweave_birthDate');
  const box = document.getElementById('lr-answers');
  try {
    const res = await fetch('/api/live-reader', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email, birthDate, sessionId: state.sessionId, question: q, lang: state.lang }) });
    const data = await res.json();
    if (!res.ok) { box.innerHTML += `<p><strong>Live Reader:</strong> ${data.error || 'Could not answer.'}</p>`; return; }
    document.getElementById('lr-used').textContent = data.questionsUsed;
    box.innerHTML += `<p><strong>You:</strong> ${q}</p><p><strong>Live Reader:</strong> ${data.answer}</p>`;
    document.getElementById('lr-question').value = '';
    if (document.getElementById('lr-speak').checked && 'speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(data.answer);
      u.lang = state.lang === 'zh' ? 'zh-TW' : 'en-US';
      speechSynthesis.speak(u);
      document.getElementById('lr-stop').classList.remove('hidden');
    }
  } catch (err) { box.innerHTML += `<p>Error: ${err.message}</p>`; }
});
document.getElementById('lr-voice').addEventListener('click', () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { alert('Voice input is not supported in this browser — please type your question.'); return; }
  const rec = new SR();
  rec.lang = state.lang === 'zh' ? 'zh-TW' : 'en-US';
  rec.onresult = (e) => { document.getElementById('lr-question').value = e.results[0][0].transcript; };
  rec.start();
});
document.getElementById('lr-stop').addEventListener('click', () => { speechSynthesis.cancel(); document.getElementById('lr-stop').classList.add('hidden'); });

loadPrice();
loadReport();
