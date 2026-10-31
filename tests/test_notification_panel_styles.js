const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'dashboard.css'), 'utf8');
const page = fs.readFileSync(path.join(__dirname, '..', 'dashboard.php'), 'utf8');

test('notification panel has opaque backgrounds in light and dark themes', () => {
    const light = css.match(/\.notification-panel\s*\{([^}]*)\}/);
    const dark = css.match(/html\[data-theme="dark"\]\s+\.notification-panel\s*\{([^}]*)\}/);

    assert.ok(light, 'notification panel must have a base style');
    assert.match(light[1], /background:\s*#[0-9a-f]{6}\s*;/i, 'light background must be solid');
    assert.ok(dark, 'dark notification panel must have its own style');
    assert.match(dark[1], /background:\s*#[0-9a-f]{6}\s*;/i, 'dark background must be solid');
    assert.match(page, /dashboard\.css\?v=20261027-notification-panel/, 'bump the stylesheet URL to refresh cached CSS');
});