/* «Грязные» данные: порча строки csv так, как это происходит в жизни.
   Включается настройкой генератора; нужна, чтобы проверить предупреждения конвертера.
   Каждое правило: { title, columns: /шаблон алиаса/, chance, spoil(значение, rnd) → новое значение }. */
(function (C) {
  'use strict';

  /** 40702810500000012345 → «4,0702810500E+19», как после пересохранения файла в Excel. */
  function excelNumber(value, rnd) {
    const mantissa = value.slice(1, rnd.int(3, 12)).replace(/0+$/, '');
    return `${value[0]}${mantissa ? ',' + mantissa : ''}E+${value.length - 1}`;
  }

  /** «г. Москва, ул. Ленина, д. 5, кв. 12» — адрес, набранный одной строкой, а не по полям формы. */
  function freeFormAddress(value) {
    const [, , , city, street, house, , , flat] = value.split(',').map(s => s.trim());
    return [city, `ул. ${street}`, `д. ${house}`, flat && `кв. ${flat}`].filter(Boolean).join(', ');
  }

  /** Адрес из 8 частей: без пустого «Района». */
  const withoutDistrict = value => value.replace(/^([^,]*,[^,]*), ,/, '$1,');

  const rules = [
    { title: 'счёт пересохранён в Excel',     columns: /^bank\.(account|corrAccount)$/,                  chance: 0.6,  spoil: excelNumber },
    { title: 'потеряны ведущие нули',         columns: /(^bank\.bik|\.inn|\.snils|^req\.okpo)$/,         chance: 0.6,  spoil: v => v.replace(/^0+/, '') },
    { title: 'адрес набран одной строкой',    columns: /\.addr(Reg|Live|Post|Legal)$/,                   chance: 0.1,  spoil: freeFormAddress },
    { title: 'адрес без части «Район»',       columns: /\.addr(Reg|Live|Post|Legal)$/,                   chance: 0.15, spoil: withoutDistrict },
  ];

  /** Портит значения строки { алиас: значение } на месте. */
  function spoil(row, rnd) {
    for (const [alias, value] of Object.entries(row)) {
      if (!value) continue;
      const rule = rules.find(r => r.columns.test(alias) && rnd.chance(r.chance));
      if (rule) row[alias] = rule.spoil(value, rnd);
    }
  }

  C.generator.dirty = { rules, spoil };
})(globalThis.Comita);
