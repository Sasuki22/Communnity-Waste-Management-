const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const home = () => fs.readFileSync(path.join(root, 'src/app/index.tsx'), 'utf8');

test('landing adapts website identity, hero and recycling art for the app', () => {
  const source = home();
  assert.match(source, /Community/);
  assert.match(source, /Waste Management/);
  assert.match(source, /Together for a Cleaner,/);
  assert.match(source, /Greener Community/);
  assert.match(source, /require\(['"]@\/assets\/images\/recycling-bins\.webp['"]\)/);
  assert.match(source, /#f4fff3|#09812e/i);
  assert.ok(fs.existsSync(path.join(root, 'assets/images/recycling-bins.webp')));
});

test('landing opens the service journey without claiming an unsubmitted pickup', () => {
  const source = home();
  assert.match(source, /Get Started/);
  assert.match(source, /\/services/);
  assert.doesNotMatch(source, /onPress=\{submitPickup\}/);
});

test('menu auth controls link to implemented resident screens', () => {
  const source = fs.readFileSync(path.join(root, 'src/components/site-menu.tsx'), 'utf8');
  assert.match(source, /Log in/);
  assert.match(source, /Register/);
  assert.match(source, /go\('\/login'\)/);
  assert.match(source, /go\('\/register'\)/);
  assert.ok(fs.existsSync(path.join(root, 'src/app/login.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'src/app/register.tsx')));
});

test('resident registration is navigable as a stack screen', () => {
  const layout = fs.readFileSync(path.join(root, 'src/app/_layout.tsx'), 'utf8');
  assert.match(layout, /<Stack screenOptions=/);
  assert.doesNotMatch(layout, /<NativeTabs/);
});