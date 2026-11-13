'use strict';
/* Сверка собственного валидатора XSD с эталонным (libxml2, утилита xmllint):
   на верных XML и на испорченных разными способами вердикт «проходит / не проходит» обязан совпасть. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const C = require('../node-loader.js');
const { xml, random } = C.core;

const xsdPath = path.join(__dirname, '..', 'schemas', 'CLIENTINFO_merged.xsd');
const hasXmllint = spawnSync('xmllint', ['--version']).status === 0;
const today = new Date(2026, 10, 13);

const walk = (node, out = []) => { out.push(node); node.children.forEach(c => walk(c, out)); return out; };
const parentOf = (root, node) => walk(root).find(n => n.children.includes(node));

/** Способы испортить XML. Каждый меняет дерево на месте; если портить нечего — ничего не делает. */
const some = (rnd, list, change) => { if (list.length) change(rnd.pick(list)); };
const inner = root => walk(root).slice(1);
const detach = (root, n) => { const p = parentOf(root, n); return [p, p.children.indexOf(n)]; };
const MUTATIONS = {
  remove: (root, rnd) => some(rnd, inner(root), n => { const [p, i] = detach(root, n); p.children.splice(i, 1); }),
  duplicate: (root, rnd) => some(rnd, inner(root), n => { const [p, i] = detach(root, n); p.children.splice(i, 0, structuredClone(n)); }),
  swap: (root, rnd) => some(rnd, walk(root).filter(n => n.children.length > 1), p => { const i = rnd.int(0, p.children.length - 2); [p.children[i], p.children[i + 1]] = [p.children[i + 1], p.children[i]]; }),
  rename: (root, rnd) => some(rnd, inner(root), n => { n.tag = rnd.pick(['Неизвестный', 'Имя', 'Пункт', 'ОГРН', 'КодОКСМ']); }),
  text: (root, rnd) => some(rnd, walk(root).filter(n => !n.children.length), n => { n.text = rnd.pick(['', 'X', '12', '1', '0', '01/01/2020', '2020-01-01', '643', 'я'.repeat(260), 'я'.repeat(2100), ' 1 ']); }),
  insert: (root, rnd) => some(rnd, walk(root), n => { n.children.push({ tag: rnd.pick(['Лишний', 'Телефон', 'ИнаяИнф', 'СведенияФЛИП', 'Отч']), attrs: {}, children: [], text: rnd.pick(['', '1', 'текст']) }); }),
  attribute: (root, rnd) => some(rnd, walk(root), n => { n.attrs = { x: '1' }; }),
  empty: (root, rnd) => some(rnd, walk(root).filter(n => n.children.length), n => { n.children = []; }),
};

test('валидатор XSD: вердикт совпадает с xmllint на верных и испорченных XML', { skip: !hasXmllint && 'xmllint не установлен' }, () => {
  const rnd = random.create(99);
  const corpus = [];
  for (const type of ['PRSN', 'BUSN', 'LEGL']) {
    const file = C.services.generate.generate({ type, count: 12, seed: 5, dirty: true, today });
    for (const r of C.services.convert.convertAll(C.services.load.load(file.text, file.fileName), { employee: { lastName: 'Петров', firstName: 'Пётр' } })) {
      corpus.push({ name: `ok-${corpus.length}`, text: r.xml });
      for (const kind of Object.keys(MUTATIONS)) {
        for (let i = 0; i < 4; i++) {
          const tree = xml.parse(r.xml);
          MUTATIONS[kind](tree, rnd);
          if (i === 3) MUTATIONS[rnd.pick(Object.keys(MUTATIONS))](tree, rnd);
          corpus.push({ name: `${kind}-${corpus.length}`, text: xml.serialize(tree) });
        }
      }
    }
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'comita-parity-'));
  const reference = new Map();
  try {
    corpus.forEach(c => fs.writeFileSync(path.join(dir, `${c.name}.xml`), c.text));
    for (let i = 0; i < corpus.length; i += 200) {
      const files = corpus.slice(i, i + 200).map(c => path.join(dir, `${c.name}.xml`));
      const run = spawnSync('xmllint', ['--noout', '--schema', xsdPath, ...files], { encoding: 'utf8', maxBuffer: 1 << 28 });
      for (const m of run.stderr.matchAll(/([^\s/]+)\.xml (validates|fails to validate)/g)) reference.set(m[1], m[2] === 'validates');
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }

  assert.equal(reference.size, corpus.length, 'xmllint дал вердикт по каждому файлу');
  const differ = corpus.filter(c => C.services.schema.validate(c.text).ok !== reference.get(c.name));
  const invalid = corpus.filter(c => !reference.get(c.name)).length;
  assert.ok(invalid > corpus.length / 3, `в корпусе достаточно неверных XML (${invalid} из ${corpus.length})`);
  assert.deepEqual(differ.map(c => `${c.name}: xmllint=${reference.get(c.name)}\n${c.text.slice(0, 1500)}`), []);
});
