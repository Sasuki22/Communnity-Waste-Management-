const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '..', 'dashboard.js'), 'utf8');
const context = {
    window: {},
    document: { addEventListener() {} }
};
vm.createContext(context);
vm.runInContext(script, context);

const schedules = [
    { id: 1, icon: 'trash', waste_type: 'General Waste', day_of_week: 'Monday' },
    { id: 2, icon: 'recycle', waste_type: 'Recyclable Waste', day_of_week: 'Wednesday' },
    { id: 3, icon: 'leaf', waste_type: 'Organic Waste', day_of_week: 'Friday' },
    { id: 4, icon: 'warning', waste_type: 'Hazardous Waste', day_of_week: 'Saturday' }
];

test('upcoming and full schedule render API icon names as symbols', () => {
    const upcoming = { innerHTML: '', querySelectorAll: () => [] };
    const full = { innerHTML: '' };
    context.renderUpcomingList(schedules, upcoming);
    context.renderScheduleCards(schedules, full);
    for (const html of [upcoming.innerHTML, full.innerHTML]) {
        for (const symbol of ['🗑️', '♻️', '🌿', '⚠️']) {
            assert.ok(html.includes(symbol), `Missing ${symbol} in schedule`);
        }
        assert.doesNotMatch(html, />trash General Waste|>recycle Recyclable Waste|>leaf Organic Waste|>warning Hazardous Waste/);
    }
});

test('existing emoji icons and untrusted icon text are handled safely', () => {
    const container = { innerHTML: '', querySelectorAll: () => [] };
    context.renderUpcomingList([
        { id: 1, icon: '♻️', waste_type: 'Recyclable Waste', day_of_week: 'Wednesday' },
        { id: 2, icon: '<img src=x onerror=alert(1)>', waste_type: 'Custom Waste', day_of_week: 'Monday' }
    ], container);
    assert.match(container.innerHTML, /♻️ Recyclable Waste/);
    assert.doesNotMatch(container.innerHTML, /<img src=x/);
});