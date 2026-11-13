'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../node-loader.js');
const { generate } = C.services.generate;
const { load } = C.services.load;
const { convertAll } = C.services.convert;
const s = C.core.checksums;

const today = new Date(2026, 10, 13);
const TYPES = ['PRSN', 'BUSN', 'LEGL'];
const parseDate = v => { const [d, m, y] = v.split('.').map(Number); return Date.UTC(y, m - 1, d); };

test('генератор: число строк, заголовки и повторяемость по зерну', () => {
  for (const type of TYPES) {
    const a = generate({ type, count: 25, seed: 3, today });
    const table = C.core.csv.parse(a.text);
    assert.equal(table.length, 26);
    assert.deepEqual(table[0], C.model.input.byType[type].columns.map(c => c.header));
    assert.equal(a.text, generate({ type, count: 25, seed: 3, today }).text);
    assert.notEqual(a.text, generate({ type, count: 25, seed: 4, today }).text);
  }
});

test('генератор → конвертер: чистые данные проходят XSD без единого замечания', () => {
  for (const type of TYPES) {
    const file = generate({ type, count: 400, seed: 11, today });
    const loaded = load(file.text, file.fileName);
    assert.deepEqual(loaded.issues, []);
    assert.equal(loaded.rows.length, 400);
    for (const r of convertAll(loaded)) {
      assert.ok(r.ok, JSON.stringify(r.xsd.errors));
      assert.deepEqual(r.issues, [], r.fileName);
    }
  }
});

test('генератор: контрольные суммы и согласованность значений', () => {
  const okato = C.model.dict.regions.codeByName;
  for (const type of TYPES) {
    const file = generate({ type, count: 300, seed: 21, today });
    for (const row of load(file.text, file.fileName).rows) {
      assert.ok(s.checkAccount(row['bank.account'], row['bank.bik']), 'расчётный счёт');
      assert.ok(s.checkAccount(row['bank.corrAccount'], row['bank.bik'], true), 'корсчёт');
      assert.ok(parseDate(row['reg.applyDate']) <= parseDate(row['reg.identDate']));
      assert.ok(parseDate(row['reg.identDate']) <= parseDate(row['reg.regDate']));
      const who = type === 'LEGL' ? 'ceo' : 'main';
      assert.ok(s.checkInn(row[`${who}.inn`]) && row[`${who}.inn`].length === 12);
      assert.match(row[`${who}.docDeptCode`], /^\d{3}-\d{3}$/);
      assert.match(row[`${who}.docNumber`], /^\d{6}$/);
      const age = (parseDate(row[`${who}.docIssueDate`]) - parseDate(row[`${who}.birthDate`])) / (365.25 * 86400000);
      assert.ok(age >= 14 && parseDate(row[`${who}.docIssueDate`]) <= today.getTime(), 'паспорт выдан после 14 лет и не в будущем');
      const parts = row[`${who}.addrReg`].split(',').map(v => v.trim());
      assert.equal(parts.length, 9);
      assert.equal(row[`${who}.docSeries`].slice(0, 2), okato(parts[1]), 'серия паспорта начинается с кода региона');
      if (type !== 'LEGL') assert.ok(s.checkSnils(row['main.snils']));
      if (type === 'BUSN') {
        assert.ok(s.checkOgrn(row['ip.ogrnip']) && row['ip.ogrnip'].length === 15);
        assert.ok(parseDate(row['ip.regDate']) >= parseDate(row['main.birthDate']) + 18 * 365 * 86400000, 'ИП зарегистрирован совершеннолетним');
      }
      if (type === 'LEGL') {
        assert.ok(s.checkInn(row['req.inn']) && row['req.inn'].length === 10);
        assert.ok(s.checkOgrn(row['req.ogrn']) && row['req.ogrn'].length === 13);
        assert.ok(s.checkOkpo(row['req.okpo']));
        assert.match(row['req.kpp'], /^\d{9}$/);
      }
    }
  }
});

test('генератор: «грязные» данные дают предупреждения, но XML остаётся верным', () => {
  for (const type of TYPES) {
    const file = generate({ type, count: 300, seed: 31, dirty: true, today });
    const results = convertAll(load(file.text, file.fileName));
    assert.ok(results.every(r => r.ok));
    const messages = results.flatMap(r => r.issues.map(i => i.message)).join('\n');
    for (const expected of [/повреждено при пересохранении в Excel/, /пропущен Район/, /без разбора/, /восстановлены ведущие нули/]) assert.match(messages, expected);
  }
});
