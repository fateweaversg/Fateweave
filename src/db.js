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

  CREATE TABLE IF NOT EXISTS live_reader_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL,
    session_id TEXT NOT NULL,
    question_count INTEGER NOT NULL DEFAULT 0,
    last_asked_at TEXT,
    UNIQUE(token_hash, session_id)
  );

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
  -- paid session. One row per message, user or Master. Live Reader Q&A is
  -- stored here too (source = 'live-reader') so follow-ups can refer back
  -- to it; only source = 'master' user messages count toward the 5-message
  -- follow-up limit. No other buyer's data is ever read for a session.
  CREATE TABLE IF NOT EXISTS master_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_hash TEXT NOT NULL,
    session_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' | 'master'
    content TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'en',
    source TEXT NOT NULL DEFAULT 'master', -- 'master' | 'live-reader'
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_master_chat_session ON master_chat_messages(token_hash, session_id, id);

  -- Extended Master Chat upgrade (7 Nov 2026 20:04 SGT): a paid $3
  -- upgrade gives the buyer 30 Master chats in total for the same
  -- 90-day window as the unlock (the 5
  -- included follow-ups are part of that 30). Keyed by buyer (email +
  -- birth_date), not by one token, because a buyer can hold several
  -- tokens (fresh token per checkout-session exchange). expires_at is
  -- the unlock's expiry; the upgrade never outlives the reading it
  -- belongs to. The 30-chat count itself lives in the ai_usage ledger
  -- (src/ai-master.js buyerAiCallsTotal), not here — this table only
  -- records that the upgrade was bought. Existing rows (e.g. the
  -- owner's own $3 test purchase) are treated as a 30-chat grant.
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

module.exports = { db };
