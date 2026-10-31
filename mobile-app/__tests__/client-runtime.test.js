const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../src/api/client.ts'), 'utf8');

function loadClient() {
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const filename = path.join(__dirname, '../src/api/client.ts');
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = module.paths;
  mod._compile(compiled, filename);
  return mod.exports;
}

test('requires an HTTPS site or loopback development URL', () => {
  const { apiBase } = loadClient();
  const previous = process.env.EXPO_PUBLIC_API_URL;
  try {
    for (const value of ['', 'http://example.com', 'http://localhost.evil.com', 'https://example.com/path?token=x', 'https://example.com/#secret']) {
      process.env.EXPO_PUBLIC_API_URL = value;
      assert.throws(() => apiBase(), /EXPO_PUBLIC_API_URL/);
    }
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com/cwms/';
    assert.equal(apiBase(), 'https://example.com/cwms');
    process.env.EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8080';
    assert.equal(apiBase(), 'http://127.0.0.1:8080');
  } finally {
    if (previous === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previous;
  }
});

test('parses success and sends bearer token only to API base', async () => {
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousFetch = global.fetch;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com/cwms';
    process.env.EXPO_PUBLIC_API_URL = '';
    await assert.rejects(loadClient().api('contact.php'), /EXPO_PUBLIC_API_URL/);
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com/cwms';
    global.fetch = async (url, options) => {
      assert.equal(url, 'https://example.com/cwms/mobile_api/auth.php?action=me');
      assert.equal(options.headers.get('Authorization'), 'Bearer secret');
      return { ok: true, status: 200, text: async () => '{"success":true,"user":{"id":1}}' };
    };
    assert.equal((await loadClient().api('mobile_api/auth.php?action=me', {}, 'secret')).user.id, 1);
    global.fetch = async (url) => {
      assert.equal(url, 'https://example.com/cwms/mobile_api/content.php?action=schedules&zone=North%20Zone');
      return { ok: true, status: 200, text: async () => '{"success":true,"data":[]}' };
    };
    await loadClient().api('mobile_api/content.php?action=schedules&zone=North%20Zone');
    await assert.rejects(loadClient().api('https://evil.example/collect', {}, 'secret'), /path/i);
    await assert.rejects(loadClient().api('mobile_api/auth.php/../contact.php', {}, 'secret'), /path/i);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
  }
});

test('preserves status for unauthorized and rate-limited replies', async () => {
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousFetch = global.fetch;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com';
    const { api } = loadClient();
    for (const status of [401, 429]) {
      global.fetch = async () => ({ ok: false, status, text: async () => JSON.stringify({ success: false, message: 'Try again' }) });
      await assert.rejects(api('contact.php'), error => error.status === status && error.message === 'Try again');
    }
    global.fetch = async () => ({ ok: false, status: 500, text: async () => '<html>Server error</html>' });
    await assert.rejects(api('contact.php'), error => error.status === 500 && /500/.test(error.message) && !error.message.includes('<html>'));
    global.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(api('contact.php'), /Network unavailable/);
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
  }
});

test('form-encoded contact is not mislabeled as JSON', async () => {
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousFetch = global.fetch;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com';
    global.fetch = async (_url, options) => {
      assert.notEqual(options.headers.get('Content-Type'), 'application/json');
      assert.equal(options.body.toString(), 'name=Ada&email=ada%40gmail.com&message=Hello');
      return { ok: true, status: 200, text: async () => '{"success":true}' };
    };
    await loadClient().api('contact.php', { method: 'POST', body: new URLSearchParams({ name: 'Ada', email: 'ada@gmail.com', message: 'Hello' }) });
  } finally {
    global.fetch = previousFetch;
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
  }
});