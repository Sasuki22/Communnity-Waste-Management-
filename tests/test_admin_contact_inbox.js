const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('admin contact tab loads and escapes message content', () => {
    const php = fs.readFileSync(path.join(root, 'admin_modern.php'), 'utf8');
    const js = fs.readFileSync(path.join(root, 'admin_modern.js'), 'utf8');
    const css = fs.readFileSync(path.join(root, 'admin_modern.css'), 'utf8');
    assert.match(php, /data-tab="contact"/);
    assert.match(php, /id="contactMessagesList"/);
    assert.match(js, /contact:\s*loadContactMessages/);
    assert.match(js, /request\('contact_messages'\)/);
    assert.match(js, /escapeHtml\(item\.name\)/);
    assert.match(js, /escapeHtml\(item\.email\)/);
    assert.match(js, /escapeHtml\(item\.message\)/);
    assert.match(css, /html\[data-theme="dark"\] \.contact-card/);
});