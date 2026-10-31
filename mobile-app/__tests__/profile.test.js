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
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
  return mod.exports;
}

test('phone input is limited and normalizes Philippine mobile numbers', () => {
  const { formatPhoneInput, normalizePhone } = load('api/profile.ts');
  assert.equal(formatPhoneInput('09ab17123456789'), '09171234567');
  assert.equal(formatPhoneInput('+6309171234567899'), '+6309171234567');
  assert.equal(normalizePhone('09171234567'), '09171234567');
  assert.equal(normalizePhone('+639171234567'), '09171234567');
  assert.equal(normalizePhone('+6309171234567'), '09171234567');
  assert.equal(normalizePhone(''), '');
  for (const invalid of ['0917123456', '08171234567', '+630917123456', '+6391712345679', 'abc']) {
    assert.throws(() => normalizePhone(invalid), /mobile number/i);
  }
});

test('profile reads and saves through the authenticated mobile API with form encoding', async () => {
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousFetch = global.fetch;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com';
    const requests = [];
    global.fetch = async (url, options) => {
      requests.push({ url, options });
      return { ok: true, status: 200, text: async () => '{"success":true,"user":{"full_name":"Ada","email":"ada@example.com","phone":"09171234567","address":"Zone 1","profile_picture":null}}' };
    };
    const { getProfile, saveProfile } = load('api/profile.ts');
    assert.equal((await getProfile('secret')).full_name, 'Ada');
    assert.equal((await saveProfile('secret', { full_name: ' Ada ', email: 'ADA@example.com ', phone: '+6309171234567', address: 'Zone 1' })).phone, '09171234567');
    assert.deepEqual(requests.map(({url, options}) => [url, options.method || 'GET', options.headers.get('Authorization')]), [
      ['https://example.com/mobile_api/profile.php', 'GET', 'Bearer secret'],
      ['https://example.com/mobile_api/profile.php', 'POST', 'Bearer secret'],
    ]);
    assert.equal(requests[1].options.body.get('phone'), '09171234567');
    assert.equal(requests[1].options.body.get('full_name'), 'Ada');
    assert.equal(requests[1].options.headers.get('Content-Type'), null);
    const count = requests.length;
    await assert.rejects(saveProfile('secret', { full_name: 'Ada', email: 'ada@example.com', phone: '123', address: '' }), /mobile number/i);
    assert.equal(requests.length, count);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
  }
});

test('resident profile is reachable and does not advertise unsupported photo upload', () => {
  const root = path.join(__dirname, '../src');
  const screen = fs.readFileSync(path.join(root, 'app/profile.tsx'), 'utf8');
  const menu = fs.readFileSync(path.join(root, 'components/site-menu.tsx'), 'utf8');
  assert.match(screen, /getProfile\(session\.token\)/);
  assert.match(screen, /saveProfile\(session\.token/);
  assert.match(screen, /maxLength: 14/);
  assert.match(screen, /formatPhoneInput/);
  assert.match(menu, /'Profile', '\/profile'/);
  assert.doesNotMatch(screen, /Choose profile picture|expo-image-picker/);
});