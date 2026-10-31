const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

test('Expo Router Link asChild never receives a child with an array-valued style', () => {
  const app = path.join(__dirname, '../src/app');
  const unsafe = [];
  for (const file of fs.readdirSync(app).filter(name => name.endsWith('.tsx'))) {
    const source = ts.createSourceFile(file, fs.readFileSync(path.join(app, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(node) {
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === 'Link' &&
          node.openingElement.attributes.properties.some(attr => ts.isJsxAttribute(attr) && attr.name.text === 'asChild')) {
        for (const child of node.children) {
          if (!ts.isJsxElement(child) && !ts.isJsxSelfClosingElement(child)) continue;
          const opening = ts.isJsxElement(child) ? child.openingElement : child;
          const style = opening.attributes.properties.find(attr => ts.isJsxAttribute(attr) && attr.name.text === 'style');
          if (style?.initializer && ts.isJsxExpression(style.initializer) && style.initializer.expression && ts.isArrayLiteralExpression(style.initializer.expression)) {
            unsafe.push(`${file}:${source.getLineAndCharacterOfPosition(style.pos).line + 1}`);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  assert.deepEqual(unsafe, [], `Link asChild cannot wrap an array-styled element: ${unsafe.join(', ')}`);
});

test('resident action cards navigate directly instead of wrapping mapped cards with Link asChild', () => {
  const resident = fs.readFileSync(path.join(__dirname, '../src/app/resident.tsx'), 'utf8');
  assert.match(resident, /actions\.map\(\(item, index\) => <Pressable/);
  assert.match(resident, /onPress=\{\(\) => router\.push\(item\.href\)\}/);
  assert.doesNotMatch(resident, /actions\.map\(item => <Link/);
});