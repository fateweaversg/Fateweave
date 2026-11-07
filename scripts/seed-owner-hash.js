'use strict';
/** Generate a bcrypt hash for OWNER_PASSWORD_HASH. Usage: node scripts/seed-owner-hash.js "your-password" */
const bcrypt = require('bcryptjs');
const password = process.argv[2];
if (!password || password.length < 10) {
  console.error('Usage: node scripts/seed-owner-hash.js "a-strong-password-at-least-10-chars"');
  process.exit(1);
}
bcrypt.hash(password, 12).then((hash) => {
  console.log('Put this in .env as OWNER_PASSWORD_HASH (never commit the password itself):');
  console.log(hash);
});
