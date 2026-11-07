'use strict';
/**
 * Daily encouragement job — run at 07:00 SGT.
 * Usage: `node src/jobs/daily.js` from a cron (see README / DEPLOY-CHECKLIST).
 * Sends one short encouragement email per subscribed buyer, once per day.
 * Uses the buyer's stored birth profile to personalise the essence line.
 * Never sends to unsubscribed addresses. Idempotent per (email, send_date).
 */
const { db } = require('../db');
const { buildFullReading } = require('../readings');
const { DAILY_ENCOURAGEMENTS } = require('../i18n');
const { sendDailyEmail } = require('../email');

async function main() {
  const todaySgt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const subs = db.prepare('SELECT * FROM email_subscribers WHERE unsubscribed = 0').all();
  console.log(`Daily job ${todaySgt}: ${subs.length} subscriber(s).`);
  let sent = 0, skipped = 0, failed = 0;
  for (const sub of subs) {
    const already = db.prepare('SELECT 1 FROM daily_sends WHERE email = ? AND send_date = ?').get(sub.email, todaySgt);
    if (already) { skipped++; continue; }
    try {
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
      const encouragement = DAILY_ENCOURAGEMENTS[dayOfYear % DAILY_ENCOURAGEMENTS.length];
      let reading = null;
      if (sub.birth_date) { try { reading = buildFullReading({ birthDate: sub.birth_date, birthTime: null, name: sub.name }); } catch { reading = null; } }
      await sendDailyEmail(sub.email, sub.name, reading, encouragement, 'en');
      db.prepare('INSERT INTO daily_sends (email, send_date) VALUES (?, ?)').run(sub.email, todaySgt);
      sent++;
    } catch (e) {
      failed++;
      console.error(`Daily send failed for ${sub.email}:`, e.message);
    }
  }
  console.log(`Daily job done: sent=${sent} skipped=${skipped} failed=${failed}`);
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { main };
