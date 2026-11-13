/* Описание входной структуры (csv). Колонки задаются по порядку: заголовки в выгрузке
   обрезаны и повторяются, поэтому колонку определяет её позиция, а не имя.

     section('ben', '->Сведения о бенефициарных владель')   служебная колонка-маркер секции
     col('lastName', 'Фамилия')                             алиас поля = «секция.имя» → ben.lastName
     col('main.pep', '…')                                   алиас с точкой задаётся целиком

   define() превращает список в структуру { type, title, columns: [{ index, alias, header, marker }] }. */
(function (C) {
  'use strict';

  const section = (alias, header) => ({ section: alias, header });
  const col = (alias, header) => ({ alias, header });

  function define(type, title, items) {
    const columns = [];
    let current = '';
    for (const it of items) {
      if (it.section) {
        current = it.section;
        columns.push({ index: columns.length, alias: `${current}.$marker`, header: it.header, marker: true });
      } else {
        const alias = it.alias.includes('.') ? it.alias : `${current}.${it.alias}`;
        columns.push({ index: columns.length, alias, header: it.header, marker: false });
      }
    }
    const seen = new Set();
    for (const c of columns) {
      if (seen.has(c.alias)) throw new Error(`Входная структура ${type}: алиас «${c.alias}» повторяется`);
      seen.add(c.alias);
    }
    return { type, title, columns, aliases: seen };
  }

  C.model.input.dsl = { section, col, define };
})(globalThis.Comita);
