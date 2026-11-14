'use strict';
/**
 * Access tokens + owner auth.
 *
 * - Buyer tokens are crypto.randomBytes(32), stored ONLY as SHA-256 hashes.
 *   No deterministic code, no minting secret in the client, nothing to forge
 *   from the page source. Token is bound to email + birth_date, expires in
 *   ACCESS_TOKEN_DAYS (default 90). Same buyer revisits with the same
 *   email + birth date + token.
 * - Owner access is a server-checked bcrypt password hash from env
 *   (OWNER_PASSWORD_HASH). No public owner link anywhere in the frontend.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db } = require('./db');
const { config } = require('./config');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function issueAccessToken(email, birthDate, orderId, days = config.accessTokenDays) {
  const token = crypto.randomBytes(32).toString('hex'); // 64 hex chars
  const accessDays = Math.max(1, Math.min(365, Number(days) || config.accessTokenDays));
  const expiresAt = new Date(Date.now() + accessDays * 24 * 60 * 60 * 1000).toISOString();
  db.prepare(
    'INSERT INTO access_tokens (token_hash, email, birth_date, order_id, expires_at) VALUES (?, ?, ?, ?, ?)'
  ).run(hashToken(token), email.toLowerCase(), birthDate, orderId || null, expiresAt);
  return { token, expiresAt };
}

function verifyAccessToken(token, email, birthDate) {
  if (!token || typeof token !== 'string') return null;
  const row = db.prepare(
    'SELECT * FROM access_tokens WHERE token_hash = ? AND revoked = 0'
  ).get(hashToken(token));
  if (!row) return null;
  if (row.email !== String(email || '').toLowerCase()) return null;
  if (row.birth_date !== birthDate) return null;
  if (new Date(row.expires_at) < new Date()) return null;
  return row;
}

function issueOwnerToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO owner_tokens (token_hash, expires_at) VALUES (?, ?)').run(hashToken(token), expiresAt);
  return { token, expiresAt };
}

function verifyOwnerToken(token) {
  if (!token) return false;
  const row = db.prepare('SELECT * FROM owner_tokens WHERE token_hash = ?').get(hashToken(token));
  if (!row) return false;
  return new Date(row.expires_at) > new Date();
}

async function checkOwnerPassword(password) {
  if (!config.ownerPasswordHash || !password) return false;
  return bcrypt.compare(password, config.ownerPasswordHash);
}

module.exports = { hashToken, issueAccessToken, verifyAccessToken, issueOwnerToken, verifyOwnerToken, checkOwnerPassword };
