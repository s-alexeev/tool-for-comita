/* Язык описания генерации. Одна строка — одна колонка csv:

     put('main.inn', 'person.inn')
          │           └─ откуда взять значение: путь внутри сгенерированного клиента (generator/entities.js)
          └─ алиас колонки входной структуры (model/input)

   Колонка без правила остаётся пустой. personColumns() — набор колонок «физическое лицо»,
   который повторяется в нескольких секциях csv с разными префиксами. */
(function (C) {
  'use strict';

  const put = (column, from) => ({ column, from });

  /** Колонки сведений о физическом лице: section — секция csv, from — путь к человеку в клиенте. */
  const personColumns = (section, from) => [
    put(`${section}.lastName`,     `${from}.lastName`),
    put(`${section}.firstName`,    `${from}.firstName`),
    put(`${section}.middleName`,   `${from}.middleName`),
    put(`${section}.birthDate`,    `${from}.birthDate`),
    put(`${section}.birthPlace`,   `${from}.birthPlace`),
    put(`${section}.citizenship`,  `${from}.citizenship`),
    put(`${section}.addrReg`,      `${from}.addrReg`),
    put(`${section}.docType`,      `${from}.docType`),
    put(`${section}.docSeries`,    `${from}.docSeries`),
    put(`${section}.docNumber`,    `${from}.docNumber`),
    put(`${section}.docIssueDate`, `${from}.docIssueDate`),
    put(`${section}.docDeptCode`,  `${from}.docDeptCode`),
    put(`${section}.docIssuer`,    `${from}.docIssuer`),
    put(`${section}.inn`,          `${from}.inn`),
  ];

  C.generator.dsl = { put, personColumns };
})(globalThis.Comita);
