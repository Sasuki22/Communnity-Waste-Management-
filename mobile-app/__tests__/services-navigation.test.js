const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('service and how-it-works cards navigate from their press handlers without mapped Link wrappers', () => {
  const source = fs.readFileSync(path.join(__dirname, '../src/app/services.tsx'), 'utf8');
  assert.match(source, /services\.map\(item => <Pressable key=\{item\.title\}/);
  assert.match(source, /steps\.map\(item => <Pressable key=\{item\.title\}/);
  assert.equal((source.match(/onPress=\{\(\) => router\.push\(item\.href\)\}/g) || []).length, 2);
  assert.doesNotMatch(source, /<Link|asChild/);
  for (const route of ['explore', 'schedule', 'request-pickup', 'about']) {
    assert.ok(fs.existsSync(path.join(__dirname, `../src/app/${route}.tsx`)), `Missing route ${route}`);
  }
});