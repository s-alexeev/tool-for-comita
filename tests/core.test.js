'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../node-loader.js');
const { checksums: s, csv, xml } = C.core;

test('контрольные суммы: известные настоящие реквизиты', () => {
  assert.ok(s.checkInn('7707083893'), 'ИНН Сбербанка');
  assert.ok(s.checkInn('500100732259'), 'ИНН физлица');
  assert.ok(!s.checkInn('7707083894'));
  assert.ok(s.checkOgrn('1027700132195'), 'ОГРН Сбербанка');
  assert.ok(s.checkOgrn('304500116000157'), 'ОГРНИП');
  assert.ok(!s.checkOgrn('1027700132196'));
  assert.ok(s.checkSnils('11223344595'));
  assert.ok(!s.checkSnils('11223344596'));
  assert.ok(s.checkOkpo('00032537'), 'ОКПО Сбербанка');
  assert.ok(s.checkAccount('30101810400000000225', '044525225', true), 'корсчёт Сбербанка');
  assert.ok(s.checkAccount('30101810200000000593', '044525593', true), 'корсчёт Альфа-Банка');
});

test('контрольные суммы: make* даёт значение, которое проходит check*', () => {
  const rnd = C.core.random.create(5);
  for (let i = 0; i < 500; i++) {
    assert.ok(s.checkInn(s.makeInn10(rnd.digits(9))));
    assert.ok(s.checkInn(s.makeInn12(rnd.digits(10))));
    assert.ok(s.checkOgrn(s.makeOgrn(rnd.digits(12))));
    assert.ok(s.checkOgrn(s.makeOgrn(rnd.digits(14))));
    assert.ok(s.checkSnils(s.makeSnils('1' + rnd.digits(8))));
    assert.ok(s.checkOkpo(s.makeOkpo(rnd.digits(7))));
    assert.ok(s.checkAccount(s.makeAccount('40702810' + rnd.digits(12), '044525225'), '044525225'));
  }
});

test('csv: кавычки, разделитель и переносы строк внутри значения', () => {
  const rows = [['a;b', 'он сказал "да"', 'две\r\nстроки', ''], ['1', '2', '3', '4']];
  assert.deepEqual(csv.parse(csv.stringify(rows)), rows);
  assert.equal(csv.stringify([['x']]).charCodeAt(0), 0xFEFF);
});

test('xml: запись и разбор, экранирование, комментарий перед элементом', () => {
  const tree = { tag: 'А', attrs: {}, text: '', children: [{ tag: 'Б', attrs: {}, children: [], text: 'ООО "Рога & <копыта>"', comment: 'пояснение' }] };
  const text = xml.serialize(tree);
  assert.match(text, /<!-- пояснение -->\s*<Б>ООО "Рога &amp; &lt;копыта&gt;"<\/Б>/);
  assert.equal(xml.parse(text).children[0].text, 'ООО "Рога & <копыта>"');
  assert.throws(() => xml.parse('<А><Б></А>'));
});
