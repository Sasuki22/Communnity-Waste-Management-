const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(relative) {
  const filename = path.join(__dirname, '../src', relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod.require = function (request) {
    if (request === './client') return load('api/client.ts');
    return Module.prototype.require.call(this, request);
  };
  mod._compile(compiled, filename);
  return mod.exports;
}

test('resident registration posts website fields to shared users endpoint, without sending a token', async () => {
  const oldUrl = process.env.EXPO_PUBLIC_API_URL;
  const oldFetch = global.fetch;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com';
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://example.com/register.php');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.get('Authorization'), null);
      assert.deepEqual(JSON.parse(options.body), { full_name: 'Ada Lovelace', email: 'ada@example.com', password: 'secret1', confirm_password: 'secret1' });
      return { ok: true, status: 200, text: async () => '{"success":true,"message":"Account created successfully."}' };
    };
    await load('api/auth.ts').registerResident(' Ada Lovelace ', 'ADA@EXAMPLE.COM ', 'secret1', 'secret1');
    await assert.rejects(load('api/auth.ts').registerResident('Ada', 'ada@example.com', 'secret1', 'different'), /Passwords do not match/);
    global.fetch = async () => ({ ok: true, status: 200, text: async () => '{"success":false,"message":"Email is already registered."}' });
    await assert.rejects(load('api/auth.ts').registerResident('Ada', 'ada@example.com', 'secret1', 'secret1'), /Email is already registered/);
  } finally {
    global.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = oldUrl;
  }
});

test('resident login uses website credentials and returns a mobile session', async () => {
  const oldUrl = process.env.EXPO_PUBLIC_API_URL;
  const oldFetch = global.fetch;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com';
    const token = 'a'.repeat(64);
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://example.com/mobile_api/auth.php?action=login');
      assert.deepEqual(JSON.parse(options.body), { email: 'ada@example.com', password: 'secret1' });
      return { ok: true, status: 200, text: async () => JSON.stringify({ success: true, token, user: { id: 42, name: 'Ada', email: 'ada@example.com' } }) };
    };
    assert.equal((await load('api/auth.ts').loginResident('ADA@EXAMPLE.COM', 'secret1')).user.id, 42);
    global.fetch = async () => ({ ok: false, status: 401, text: async () => '{"success":false,"message":"Invalid email or password."}' });
    await assert.rejects(load('api/auth.ts').loginResident('ada@example.com', 'wrong'), /Invalid email or password/);
  } finally {
    global.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = oldUrl;
  }
});

test('resident logout posts bearer token to Hostinger mobile API', async () => {
  const oldUrl = process.env.EXPO_PUBLIC_API_URL;
  const oldFetch = global.fetch;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com';
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://example.com/mobile_api/auth.php?action=logout');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers.get('Authorization'), `Bearer ${'a'.repeat(64)}`);
      return { ok: true, status: 200, text: async () => '{"success":true}' };
    };
    await load('api/auth.ts').logoutResident('a'.repeat(64));
  } finally {
    global.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = oldUrl;
  }
});