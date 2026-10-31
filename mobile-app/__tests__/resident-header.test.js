const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(relative) {
  const filename = path.join(__dirname, '../src', relative);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod.require = request => request === './client' ? load('api/client.ts') : Module.prototype.require.call(mod, request);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
  return mod.exports;
}

test('notification list and mark-read call the authenticated website endpoints', async () => {
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousFetch = global.fetch;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com';
    const calls = [];
    global.fetch = async (url, options) => {
      calls.push({ url, options });
      return { ok: true, status: 200, text: async () => '{"success":true,"data":[{"id":2,"status":"Approved","message":"Pickup approved","is_read":0,"created_at":"2026-10-29"}]}' };
    };
    const { notifications, markNotificationsRead } = load('api/resident.ts');
    assert.equal((await notifications('secret'))[0].message, 'Pickup approved');
    await markNotificationsRead('secret');
    assert.deepEqual(calls.map(call => [call.url, call.options.method || 'GET', call.options.headers.get('Authorization')]), [
      ['https://example.com/mobile_api/content.php?action=notifications', 'GET', 'Bearer secret'],
      ['https://example.com/mobile_api/content.php?action=mark_notifications_read', 'POST', 'Bearer secret'],
    ]);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
  }
});

test('resident menu shows the website bell asset and theme action with live notifications', () => {
  const menu = fs.readFileSync(path.join(__dirname, '../src/components/site-menu.tsx'), 'utf8');
  const asset = path.join(__dirname, '../assets/images/bell-notification.svg');
  assert.equal(fs.existsSync(asset), true);
  assert.equal(fs.readFileSync(asset, 'utf8'), fs.readFileSync(path.join(__dirname, '../../images/bell-notification.svg'), 'utf8'));
  assert.match(menu, /notifications\(session\.token\)/);
  assert.match(menu, /markNotificationsRead\(session\.token\)/);
  assert.match(menu, /View notifications/);
  assert.match(menu, /Switch to .*Dark.*Light.* Mode/);
});

test('resident pages use a shared light and dark palette', () => {
  const theme = fs.readFileSync(path.join(__dirname, '../src/theme/resident-theme.tsx'), 'utf8');
  assert.match(theme, /light:/);
  assert.match(theme, /dark:/);
  for (const page of ['resident.tsx', 'schedule.tsx', 'explore.tsx']) {
    const source = fs.readFileSync(path.join(__dirname, '../src/app', page), 'utf8');
    assert.match(source, /useResidentTheme/);
  }
  assert.match(fs.readFileSync(path.join(__dirname, '../src/components/resident-form.tsx'), 'utf8'), /useResidentTheme/);
});