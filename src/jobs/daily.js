'use strict';
/**
 * Daily encouragement job — run at 07:00 SGT.
 * Usage: `node src/jobs/daily.js` from a cron (see README / DEPLOY-CHECKLIST).
 * Sends one short encouragement email per subscribed buyer, once per day.
 *
 * Item F (7 Nov 2026): the message is GENERATED for today, from that
 * buyer's own birth profile entered at input (buildDailyMessage in
 * readings.js) — today's seeded tarot card and hexagram plus the profile's
 * own Day Master / elements / Life Path. No generic line rotated from a
 * fixed list: same profile on a different day gets a different message,
 * and different profiles on the same day get different messages.
 * A subscriber with no stored birth date gets no mail (there is nothing
 * personal to generate from) — it is counted as skipped, not sent generic.
 * Never sends to unsubscribed addresses. Idempotent per (email, send_date).
 */
const { db } = require('../db');
const { buildDailyMessage } = require('../readings');
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
    if (!sub.birth_date) {
      console.log(`Daily job: no birth date stored for ${sub.email} — skipping (no generic mail).`);
      skipped++;
      continue;
    }
    try {
      const daily = buildDailyMessage({ birthDate: sub.birth_date, birthTime: null, name: sub.name }, todaySgt);
      await sendDailyEmail(sub.email, sub.name, daily, 'en');
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
