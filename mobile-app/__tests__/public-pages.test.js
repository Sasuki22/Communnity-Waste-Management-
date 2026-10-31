const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '../src', file), 'utf8');

test('public home introduces CWMS without claiming live data before sign-in', () => {
  const home = read('app/index.tsx');
  assert.match(home, /Waste Management/);
  assert.match(home, /Get Started/);
  assert.doesNotMatch(home, /Upcoming Schedule|Announcements/);
  assert.doesNotMatch(home, /Welcome to&nbsp;Expo|Expo Starter/);
});

test('guide distinguishes static tips from live schedules and rewards', () => {
  const guide = read('app/explore.tsx');
  assert.match(guide, /informational/i);
  assert.match(guide, /recycling/i);
  assert.doesNotMatch(guide, /Expo documentation|live reward balance/i);
  for (const bin of ['Green Bin:', 'Blue Bin:', 'Yellow Bin:', 'Black Bin:']) {
    assert.ok(guide.includes(bin), `missing ${bin}`);
  }
  assert.match(guide, /<SiteMenu resident=\{!!session\}/);
});

test('navigation branding has no Expo starter tab', () => {
  const menu = read('components/site-menu.tsx');
  assert.match(menu, /CWMS recycling logo/);
  assert.match(menu, /Recycling Guide/);
  assert.doesNotMatch(menu, /Expo Starter|docs\.expo\.dev/);
});

test('shared navigation uses stack and menu on web and native', () => {
  const layout = read('app/_layout.tsx');
  assert.match(layout, /<Stack screenOptions=/);
  assert.match(layout, /<AuthProvider>/);
  assert.doesNotMatch(layout, /NativeTabs|TabTrigger|TabSlot/);
});