const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function loadIcons() {
  const filename = path.join(__dirname, '../src/components/schedule-icon.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod._compile(compiled, filename);
  return mod.exports.scheduleIcon;
}

test('uses website schedule emoji when an icon is missing or corrupted', () => {
  const icon = loadIcons();
  assert.equal(icon('?', 'General Waste'), '🗑️');
  assert.equal(icon('?', 'Organic Waste'), '🌿');
  assert.equal(icon(null, 'General Waste (Zone 1)'), '🗑️');
  assert.equal(icon('�', 'Hazardous Waste'), '⚠️');
  assert.equal(icon('??', 'Recyclable Waste'), '♻️');
});

test('matches website icon names and retains valid custom icons', () => {
  const icon = loadIcons();
  assert.equal(icon('trash', 'General Waste'), '🗑️');
  assert.equal(icon('leaf', 'Organic Waste'), '🌿');
  assert.equal(icon('recycle', 'Recyclable Waste'), '♻️');
  assert.equal(icon('warning', 'Hazardous Waste'), '⚠️');
  assert.equal(icon('🛢️', 'Special Waste'), '🛢️');
});

test('dashboard preview and full schedule use the same icon formatter', () => {
  for (const page of ['resident.tsx', 'schedule.tsx']) {
    const source = fs.readFileSync(path.join(__dirname, '../src/app', page), 'utf8');
    assert.match(source, /scheduleIcon\(item\.icon, item\.waste_type\)/);
    assert.doesNotMatch(source, /\{item\.icon\}\s+\{item\.waste_type\}/);
  }
});