const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function loadContact(api) {
  const filename = path.join(__dirname, '../src/api/contact.ts');
  const source = fs.readFileSync(filename, 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.require = name => name === './client' ? { api } : require(name);
  mod._compile(js, filename);
  return mod.exports;
}

test('validates trimmed name, Gmail address and nonempty message before sending', async () => {
  let calls = 0;
  const { sendContact, validateContact } = loadContact(async () => { calls++; return { success: true }; });
  assert.match(validateContact({ name: '', email: 'a@gmail.com', message: 'hello' }), /name/i);
  assert.match(validateContact({ name: 'Ada', email: 'ada@yahoo.com', message: 'hello' }), /gmail/i);
  assert.match(validateContact({ name: 'Ada', email: 'ada@gmail.com', message: ' ' }), /message/i);
  assert.match(validateContact({ name: 'x'.repeat(101), email: 'ada@gmail.com', message: 'hello' }), /name/i);
  assert.match(validateContact({ name: 'Ada', email: 'ada@gmail.com', message: 'x'.repeat(5001) }), /message/i);
  await assert.rejects(sendContact({ name: 'Ada', email: 'not@gmail.org', message: 'hello' }), /Gmail/);
  assert.equal(calls, 0);
});

test('sends form data to existing contact.php and surfaces website errors', async () => {
  const sent = [];
  const { sendContact } = loadContact(async (path, options) => {
    sent.push({ path, options });
    return { success: true, message: 'Thanks! Your message was sent.' };
  });
  assert.equal(await sendContact({ name: ' Ada ', email: 'ADA@GMAIL.COM', message: ' Hello ' }), 'Thanks! Your message was sent.');
  assert.equal(sent[0].path, 'contact.php');
  assert.equal(sent[0].options.method, 'POST');
  assert.equal(sent[0].options.body.toString(), 'name=Ada&email=ada%40gmail.com&message=Hello');
  const limited = loadContact(async () => { throw Object.assign(new Error('Already sent today (UTC).'), { status: 429 }); });
  await assert.rejects(limited.sendContact({ name: 'Ada', email: 'ada@gmail.com', message: 'Hello' }), error => error.status === 429 && /UTC/.test(error.message));
});

test('public contact route is reachable and states the daily limit', () => {
  const app = fs.readFileSync(path.join(__dirname, '../src/app/contact.tsx'), 'utf8');
  const menu = fs.readFileSync(path.join(__dirname, '../src/components/site-menu.tsx'), 'utf8');
  assert.match(app, /sendContact/);
  assert.match(app, /one message per Gmail address per UTC day/i);
  assert.match(app, /KeyboardAvoidingView/);
  assert.match(menu, /'Contact', '\/contact'/);
});