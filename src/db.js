'use strict';
/**
 * SQLite via Node's built-in node:sqlite (Node >= 22.5, no native build needed).
 * File-based, no external DB required for a first deploy.
 * For production at scale, swap DATABASE_PATH for Postgres — see README.
 */
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { config } = require('./config');

const dbPath = path.resolve(config.databasePath);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    birth_time TEXT,
    ziwei_gender TEXT,
    name TEXT,
    amount_cents INTEGER NOT NULL,
    currency TEXT NOT NULL DEFAULT 'usd',
    price_label TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'stripe',
    provider_session_id TEXT,
    provider_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    paid_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_orders_email_birth ON orders(email, birth_date);
  CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(provider_session_id);

  CREATE TABLE IF NOT EXISTS access_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    order_id INTEGER,
    expires_at TEXT NOT NULL,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
  CREATE INDEX IF NOT EXISTS idx_tokens_hash ON access_tokens(token_hash);

  CREATE TABLE IF NOT EXISTS live_reader_usage_by_buyer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    question_count INTEGER NOT NULL DEFAULT 0,
    last_asked_at TEXT,
    UNIQUE(email, birth_date)
  );

  -- Invite-only trial codes. Codes are stored by hash, each redemption is
  -- tied to one email + birth date, and trial access expires independently
  -- from the normal paid 90-day window.
  CREATE TABLE IF NOT EXISTS trial_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_hash TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL DEFAULT '',
    max_redemptions INTEGER NOT NULL DEFAULT 1 CHECK(max_redemptions BETWEEN 1 AND 100),
    access_days INTEGER NOT NULL DEFAULT 7 CHECK(access_days IN (7, 14)),
    expires_at TEXT NOT NULL,
    disabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS trial_code_redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    order_id INTEGER NOT NULL UNIQUE,
    redeemed_at TEXT NOT NULL DEFAULT (datetime('now')),
    access_expires_at TEXT NOT NULL,
    converted_at TEXT,
    UNIQUE(email, birth_date),
    FOREIGN KEY (code_id) REFERENCES trial_codes(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
  );
  CREATE INDEX IF NOT EXISTS idx_trial_redemptions_code ON trial_code_redemptions(code_id, redeemed_at);

  CREATE TABLE IF NOT EXISTS owner_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS email_subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    birth_date TEXT,
    name TEXT,
    unsubscribed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS daily_sends (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    send_date TEXT NOT NULL,
    UNIQUE(email, send_date)
  );

  -- Ask the Master follow-up chat (7 Nov 2026): conversation memory per
  -- BUYER (email + birth_date), not per browser session. One row per
  -- message, user or Master. Live Reader Q&A is stored here too
  -- (source = 'live-reader') so follow-ups can refer back to it; only
  -- source = 'master' user messages count toward the follow-up limit.
  -- The client still sends a sessionId (kept for backward
  -- compatibility), but a fresh sessionId — a reload, a new tab, the
  -- Stripe return after the $3 upgrade — must never wipe or hide the
  -- buyer's thread. No other buyer's data is ever read for a buyer.
  CREATE TABLE IF NOT EXISTS master_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL,
    session_id TEXT NOT NULL,
    email TEXT,
    birth_date TEXT,
    role TEXT NOT NULL, -- 'user' | 'master'
    content TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'en',
    source TEXT NOT NULL DEFAULT 'master', -- 'master' | 'live-reader'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_master_chat_session ON master_chat_messages(token_hash, session_id, id);
  -- NOTE: idx_master_chat_buyer (email, birth_date) is created by the
  -- migration below, AFTER the ALTER TABLE adds those columns — it
  -- must NOT live in this block, or startup crashes on a pre-fix DB
  -- where the columns do not exist yet.

  -- Extended Master Chat upgrade (7 Nov 2026 20:04 SGT): a paid $3
  -- upgrade gives the buyer 30 Master chats in total for the same
  -- 90-day window as the unlock (the 5
  -- included follow-ups are part of that 30). Keyed by buyer (email +
  -- birth_date), not by one token, because a buyer can hold several
  -- tokens (fresh token per checkout-session exchange). expires_at is
  -- the unlock's expiry; the upgrade never outlives the reading it
  -- belongs to. The 30-chat count itself is the number of AI replies
  -- the buyer received (src/server.js masterChatCount counts stored
  -- master rows with source = 'ai') — a rule-based reply given while
  -- the AI is resting/down never consumes a chat. Existing rows (e.g.
  -- the owner's own $3 test purchase) are treated as a 30-chat grant.
  CREATE TABLE IF NOT EXISTS chat_upgrades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    order_id INTEGER,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(email, birth_date)
  );
  CREATE INDEX IF NOT EXISTS idx_chat_upgrades_buyer ON chat_upgrades(email, birth_date);

  -- AI Master usage ledger (7 Nov 2026): one row per buyer per SGT day.
  -- calls / input_tokens / output_tokens / est_cost_usd count AI (Gemini)
  -- replies only; fallback_count counts Master questions that fell back
  -- to the rule-based reply (no key, quota, caps, cooldown). The owner
  -- usage endpoint reads this table — no message text is ever stored here.
  CREATE TABLE IF NOT EXISTS ai_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    day_sgt TEXT NOT NULL,
    calls INTEGER NOT NULL DEFAULT 0,
    input_tokens INTEGER NOT NULL DEFAULT 0,
    output_tokens INTEGER NOT NULL DEFAULT 0,
    est_cost_usd REAL NOT NULL DEFAULT 0,
    fallback_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(email, birth_date, day_sgt)
  );
  CREATE INDEX IF NOT EXISTS idx_ai_usage_day ON ai_usage(day_sgt);

  -- so the full report / portrait lens survives a refresh. Free (pre-payment)
  -- quiz attempts are never stored server-side.
  CREATE TABLE IF NOT EXISTS personality_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    kind TEXT NOT NULL, -- 'enneagram' | 'mbti'
    result_json TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(email, birth_date, kind)
  );
`);

// Full Zi Wei charts require the user's birth time and selected chart sex.
// Older paid orders need a one-time prompt for those inputs, not a guessed chart.
(function migrateZiweiInputs() {
  try {
    const cols = db.prepare('PRAGMA table_info(orders)').all().map((c) => c.name);
    if (!cols.includes('ziwei_gender')) db.exec('ALTER TABLE orders ADD COLUMN ziwei_gender TEXT');
  } catch (e) {
    console.error('Zi Wei input migration failed:', e.message);
  }
})();

// --- Migration (7 Nov 2026): buyer-keyed Master history + Live Reader -----
// History and counts used to be keyed by (token_hash, session_id), and
// the browser generated a fresh random sessionId on every page load —
// so a reload, a new tab, or the Stripe return after the $3 upgrade
// showed an empty Master thread and reset both counters to 0. They are
// now keyed by the buyer (email + birth_date). This runs on every start
// and is idempotent: on a fresh DB there is nothing to migrate; on the
// live DB it backfills email/birth_date on every existing chat row from
// access_tokens (so tonight's threads reappear instead of starting
// over), sums the old per-session Live Reader counts per buyer into the
// new table, then drops the old table.
(function migrateBuyerKeying() {
  try {
    const cols = db.prepare('PRAGMA table_info(master_chat_messages)').all().map((c) => c.name);
    if (!cols.includes('email')) db.exec('ALTER TABLE master_chat_messages ADD COLUMN email TEXT');
    if (!cols.includes('birth_date')) db.exec('ALTER TABLE master_chat_messages ADD COLUMN birth_date TEXT');
    db.prepare(`UPDATE master_chat_messages SET
        email = (SELECT email FROM access_tokens WHERE access_tokens.token_hash = master_chat_messages.token_hash),
        birth_date = (SELECT birth_date FROM access_tokens WHERE access_tokens.token_hash = master_chat_messages.token_hash)
      WHERE email IS NULL`).run();
    db.exec('CREATE INDEX IF NOT EXISTS idx_master_chat_buyer ON master_chat_messages(email, birth_date, id)');
    const hasOldLr = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'live_reader_usage'").get();
    if (hasOldLr) {
      db.prepare(`INSERT INTO live_reader_usage_by_buyer (email, birth_date, question_count, last_asked_at)
        SELECT t.email, t.birth_date, SUM(u.question_count), MAX(u.last_asked_at)
        FROM live_reader_usage u JOIN access_tokens t ON t.token_hash = u.token_hash
        GROUP BY t.email, t.birth_date
        ON CONFLICT(email, birth_date) DO UPDATE SET
          question_count = live_reader_usage_by_buyer.question_count + excluded.question_count,
          last_asked_at = MAX(live_reader_usage_by_buyer.last_asked_at, excluded.last_asked_at)`).run();
      db.exec('DROP TABLE live_reader_usage');
    }
  } catch (e) {
    console.error('Buyer-keying migration failed (history/counts may be incomplete):', e.message);
  }
})();

// --- Repair (7 Nov 2026): Live Reader usage counts only questions asked
// under the buyer-keyed rule ----------------------------------------------
// The buyer-keying migration above summed the OLD per-session Live
// Reader counts into live_reader_usage_by_buyer — but under the old
// rule a refresh granted 3 fresh questions, so the sum retroactively
// exhausted buyers (the owner hit "Live Reader allows 3 questions"
// with the screen still showing 0/3 used). Live Reader usage is now
// recomputed on every start from the stored Live Reader questions
// asked AFTER the buyer-keyed rule took effect — the d7eb7336 deploy,
// 2026-11-07 22:19:31 SGT = 14:19:31 UTC (master_chat_messages
// created_at is UTC, datetime('now')). Pre-cutoff questions do not
// count; the thread history itself is untouched. Idempotent and
// self-healing: a later question increments the table (POST handler)
// and the recompute derives the same number from its stored row.
const LR_BUYER_RULE_SINCE = '2026-11-07 14:19:31';
(function repairLiveReaderUsage() {
  try {
    const fresh = db.prepare(`SELECT email, birth_date, COUNT(*) AS c, MAX(created_at) AS last_asked_at
      FROM master_chat_messages
      WHERE source = 'live-reader' AND role = 'user' AND email IS NOT NULL AND birth_date IS NOT NULL AND created_at >= ?
      GROUP BY email, birth_date`).all(LR_BUYER_RULE_SINCE);
    const current = db.prepare('SELECT email, birth_date, question_count FROM live_reader_usage_by_buyer').all();
    const same = current.length === fresh.length && current.every((r) => {
      const f = fresh.find((x) => x.email === r.email && x.birth_date === r.birth_date);
      return f && f.c === r.question_count;
    });
    if (same) return;
    db.prepare('DELETE FROM live_reader_usage_by_buyer').run();
    const ins = db.prepare('INSERT INTO live_reader_usage_by_buyer (email, birth_date, question_count, last_asked_at) VALUES (?, ?, ?, ?)');
    for (const r of fresh) ins.run(r.email, r.birth_date, r.c, r.last_asked_at);
    console.log(`Live Reader usage repaired from questions since ${LR_BUYER_RULE_SINCE} UTC: ${fresh.length} buyer(s), ${current.length} row(s) replaced`);
  } catch (e) {
    console.error('Live Reader usage repair failed:', e.message);
  }
})();

module.exports = { db };
