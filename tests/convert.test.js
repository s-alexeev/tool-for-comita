'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const C = require('../node-loader.js');
const { load } = C.services.load;
const { convert, convertAll, specFor } = C.services.convert;

const samples = path.join(__dirname, '..', 'samples');
const sample = name => load(fs.readFileSync(path.join(samples, name), 'utf8'), name);
const leaf = (result, tag) => (new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(result.xml) || [])[1];

test('маппинг каждого типа согласован со входной структурой и схемой', () => {
  for (const type of ['PRSN', 'BUSN', 'LEGL']) assert.ok(specFor(type).rules.length > 0);
});

test('образцы выгрузки: формат распознан, XML проходит XSD', () => {
  const expected = { 'prsn_registered_users_profile_info.csv': ['PRSN', 1], 'busn_registered_users_profile_info.csv': ['BUSN', 1],
    'legal_registered_users_profile_info.csv': ['LEGL', 2], 'legal_registered_users2_profile_info.csv': ['LEGL', 1] };
  for (const [name, [type, count]] of Object.entries(expected)) {
    const loaded = sample(name);
    assert.equal(loaded.type, type);
    assert.deepEqual(loaded.issues, []);
    const results = convertAll(loaded);
    assert.equal(results.length, count);
    for (const r of results) assert.ok(r.ok, `${name}: ${JSON.stringify(r.xsd.errors)}`);
  }
});

test('физическое лицо: значения, правила, умолчания с комментарием', () => {
  const [r] = convertAll(sample('prsn_registered_users_profile_info.csv'));
  assert.equal(leaf(r, 'ТипКлиента'), '2');
  assert.equal(leaf(r, 'ПризнакРезидент'), '1');
  assert.equal(leaf(r, 'ДатаРождения'), '21/07/1981');
  assert.equal(leaf(r, 'ВидДокКод'), '21');
  assert.equal(leaf(r, 'СНИЛСФЛИП'), '117-566-893 45');
  assert.equal(leaf(r, 'ИННФЛИП'), '002524598106', 'ведущие нули, потерянные в Excel, восстановлены');
  assert.equal(leaf(r, 'ПризнакПринПубЛицо'), '0');
  assert.match(r.xml, /<!-- значение по умолчанию: [^>]+ -->\s*<КлиентАктив>1<\/КлиентАктив>/);
  assert.doesNotMatch(r.xml, /<СведенияЮЛ>/);
});

test('адрес: 8 частей раскладываются по полям без «Района»', () => {
  const [r] = convertAll(sample('prsn_registered_users_profile_info.csv'));
  const reg = /<АдрРег>[\s\S]*?<\/АдрРег>/.exec(r.xml)[0];
  for (const [tag, value] of [['Индекс', '354065'], ['КодСубъектаПоОКАТО', '03'], ['Пункт', 'город Сочи'], ['Улица', 'Мира'], ['Дом', '124'], ['Оф', '17']]) {
    assert.match(reg, new RegExp(`<${tag}>${value}</${tag}>`));
  }
  assert.ok(r.issues.some(i => /пропущен Район/.test(i.message)));
});

test('адрес: строка не в формате системы целиком уходит в «Пункт»', () => {
  const t = C.mapping.transforms;
  const warns = [];
  const a = t.address('107174, г. Москва, г. Москва, ул. Новая, 2/1, 1', { warn: m => warns.push(m) });
  assert.equal(a.Индекс, '107174');
  assert.equal(a.Пункт, 'г. Москва, г. Москва, ул. Новая, 2/1, 1');
  assert.equal(a.КодСубъектаПоОКАТО, '45');
  assert.equal(a.Улица, undefined);
  assert.equal(warns.length, 1);
  const full = t.address('420500, Республика Татарстан, Лаишевский район, село Никольское, Мира, 5, 2, 1, 7', { warn: m => warns.push(m) });
  assert.deepEqual([full.КодСубъектаПоОКАТО, full.Район, full.Пункт, full.Корп, full.Оф], ['92', 'Лаишевский район', 'село Никольское', '1, стр. 2', '7']);
  assert.equal(warns.length, 1);
});

test('юридическое лицо: ОАО получает групповой код ОКОПФ с предупреждением', () => {
  const [r] = convertAll(sample('legal_registered_users_profile_info.csv'));
  assert.equal(leaf(r, 'ОКОПФЮЛ'), '12200');
  assert.ok(r.issues.some(i => /12200/.test(i.message)));
  assert.match(leaf(r, 'ИнаяИнф'), /повреждено в Excel/);
});

test('нет паспорта у физического лица — ошибка входных данных', () => {
  const loaded = sample('prsn_registered_users_profile_info.csv');
  const row = { ...loaded.rows[0], 'main.docSeries': '', 'main.docNumber': '' };
  const r = convert(row, 'PRSN');
  assert.equal(r.ok, false);
  assert.equal(r.issues.filter(i => i.level === 'error').length, 2);
});

test('значение, не проходящее по схеме, не выводится; длинный текст обрезается', () => {
  const loaded = sample('prsn_registered_users_profile_info.csv');
  const r = convert({ ...loaded.rows[0], 'main.docDeptCode': 'x'.repeat(60), 'main.lastName': 'Я'.repeat(150) }, 'PRSN');
  assert.ok(r.xsd.ok);
  assert.equal(leaf(r, 'Фам').length, 100);
  assert.equal(leaf(r, 'КодПодр').length, 50);
});

test('настройки: сотрудник попадает в XML', () => {
  const loaded = sample('prsn_registered_users_profile_info.csv');
  const r = convert(loaded.rows[0], 'PRSN', { employee: { lastName: 'Петров', firstName: 'Пётр', position: 'Специалист' } });
  assert.match(r.xml, /<ФИОСотрудника>\s*<Фам>Петров<\/Фам>\s*<Имя>Пётр<\/Имя>\s*<\/ФИОСотрудника>/);
  assert.equal(leaf(r, 'ДолжностьСотрудника'), 'Специалист');
  assert.ok(r.ok);
});

test('файл не того формата и строка не того типа дают понятные замечания', () => {
  assert.equal(load('a;b;c\r\n1;2;3\r\n', 'x.csv').type, null);
  const text = fs.readFileSync(path.join(samples, 'prsn_registered_users_profile_info.csv'), 'utf8').replace(';PRSN;', ';BUSN;');
  const loaded = load(text, 'p.csv');
  assert.equal(loaded.rows.length, 0);
  assert.equal(loaded.issues.length, 1);
});

test('выгрузка: архив — корректный zip, отчёт содержит строку на каждое замечание', () => {
  const results = convertAll(sample('legal_registered_users_profile_info.csv'));
  const zip = C.services.exporter.archive(results);
  assert.equal(Buffer.from(zip.slice(0, 4)).toString('latin1'), 'PK\x03\x04');
  const report = C.core.csv.parse(C.services.exporter.report(results));
  assert.equal(report.length - 1, results.reduce((n, r) => n + Math.max(1, r.issues.length + r.xsd.errors.length), 0));
});
