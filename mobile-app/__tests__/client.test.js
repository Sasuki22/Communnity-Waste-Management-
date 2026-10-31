const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('app API client has a single HTTPS base URL and bearer handling', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/api/client.ts'), 'utf8');
  assert.match(source, /EXPO_PUBLIC_API_URL/);
  assert.match(source, /https:/);
  assert.match(source, /Authorization/);
  assert.doesNotMatch(source, /localhost:5000|DATABASE_PASSWORD/);
});

test('app entry has no admin interface', () => {
  const route = fs.readFileSync(path.join(__dirname, '../src/app/_layout.tsx'), 'utf8');
  assert.doesNotMatch(route, /admin_modern|admin_api/);
});