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
  mod.require = function (request) {
    if (request === './client') return load('api/client.ts');
    return Module.prototype.require.call(this, request);
  };
  mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
  return mod.exports;
}

test('resident live reads and submissions use authenticated website endpoints', async () => {
  const oldUrl = process.env.EXPO_PUBLIC_API_URL;
  const oldFetch = global.fetch;
  try {
    process.env.EXPO_PUBLIC_API_URL = 'https://example.com';
    const requests = [];
    global.fetch = async (url, options) => {
      requests.push({ url, options });
      return { ok: true, status: 200, text: async () => '{"success":true,"data":[]}' };
    };
    const resident = load('api/resident.ts');
    await resident.schedules('secret');
    await resident.announcements('secret');
    await resident.requestPickup('secret', { address: 'Zone 1', waste_type: 'Bulky', preferred_date: '2026-12-01', notes: '' });
    await resident.reportIssue('secret', { issue_type: 'Missed pickup', location: 'Zone 1', description: 'Not collected' });
    assert.deepEqual(requests.map(x => x.url), [
      'https://example.com/mobile_api/content.php?action=schedules',
      'https://example.com/mobile_api/content.php?action=announcements',
      'https://example.com/mobile_api/submissions.php?action=pickup',
      'https://example.com/mobile_api/submissions.php?action=issue',
    ]);
    for (const { options } of requests) assert.equal(options.headers.get('Authorization'), 'Bearer secret');
    assert.equal(JSON.parse(requests[2].options.body).address, 'Zone 1');
    assert.equal(JSON.parse(requests[3].options.body).description, 'Not collected');
  } finally {
    global.fetch = oldFetch;
    if (oldUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = oldUrl;
  }
});