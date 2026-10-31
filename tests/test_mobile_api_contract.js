const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('mobile tokens are hashed, revocable and not backed by PHP web sessions', () => {
  const schema = read('database/mobile_sessions.sql');
  const bootstrap = read('mobile_api/bootstrap.php');
  const auth = read('mobile_api/auth.php');
  assert.match(schema, /token_hash.*CHAR\(64\)/i);
  assert.match(schema, /revoked_at/i);
  assert.match(bootstrap, /HTTP_AUTHORIZATION/);
  assert.match(bootstrap, /hash\('sha256'/);
  assert.doesNotMatch(bootstrap + auth, /session_start\s*\(/);
  assert.match(auth, /password_verify\s*\(/);
  assert.match(auth, /random_bytes\(32\)/);
  assert.match(auth, /UPDATE mobile_sessions SET revoked_at/);
});

test('mobile content, submissions and profile use authenticated resident identity', () => {
  for (const file of ['content.php', 'submissions.php', 'profile.php']) {
    const source = read('mobile_api/' + file);
    assert.match(source, /mobileUser\s*\(/);
    assert.doesNotMatch(source, /session_start\s*\(/);
  }
  assert.match(read('mobile_api/content.php'), /FROM schedules/);
  assert.match(read('mobile_api/submissions.php'), /INSERT INTO pickup_requests/);
  assert.match(read('mobile_api/submissions.php'), /INSERT INTO reported_issues/);
});