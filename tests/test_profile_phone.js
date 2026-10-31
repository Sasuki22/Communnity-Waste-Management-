const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

test('both profile save endpoints enforce the same phone normalization', () => {
  for (const endpoint of ['profile_api.php', 'mobile_api/profile.php']) {
    const source = fs.readFileSync(path.join(root, endpoint), 'utf8');
    assert.match(source, /require_once .*profile_phone\.php/);
    assert.match(source, /\$phone = normalizeProfilePhone\(/);
  }
  const form = fs.readFileSync(path.join(root, 'dashboard.php'), 'utf8');
  assert.match(form, /id="profilePhone"[\s\S]*?maxlength="14"/);
});

test('PHP rejects malformed phone numbers and stores domestic 11-digit form', { skip: !fs.existsSync('C:/xampp/php/php.exe') }, () => {
  const helper = path.join(root, 'profile_phone.php').replaceAll('\\', '/');
  const code = `require ${JSON.stringify(helper)}; echo json_encode(array_map('normalizeProfilePhone', ['', '09171234567', '+639171234567', '+6309171234567', '0917123456', 'not-a-number']));`;
  const result = spawnSync('C:/xampp/php/php.exe', ['-r', code], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), ['', '09171234567', '09171234567', '09171234567', null, null]);
});