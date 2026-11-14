'use strict';
/** Read the new owner password without echoing it or placing it in shell history. */
const bcrypt = require('bcryptjs');

if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
  console.error('Run `npm run hash-owner-password` in an interactive terminal.');
  process.exit(1);
}

process.stdout.write('New owner password (minimum 12 characters; input is hidden): ');
process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true);
process.stdin.resume();
let password = '';
process.stdin.on('data', (chunk) => {
  for (const character of chunk) {
    if (character === '\u0003') {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\nCancelled.\n');
      process.exit(1);
    }
    if (character === '\r' || character === '\n') {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (password.length < 12) {
        console.error('Choose a password with at least 12 characters, then run the command again.');
        process.exit(1);
      }
      bcrypt.hash(password, 12).then((hash) => {
        password = '';
        console.log('Copy this bcrypt hash into Railway as OWNER_PASSWORD_HASH:');
        console.log(hash);
      }).catch((error) => {
        password = '';
        console.error('Could not generate the password hash:', error.message);
        process.exitCode = 1;
      });
      return;
    }
    if (character === '\u007f' || character === '\b') password = password.slice(0, -1);
    else password += character;
  }
});
