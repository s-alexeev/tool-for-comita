/* Конвертация: строка csv → XML «Карточка клиента» (один клиент — один XML) + проверка по XSD. */
(function (C) {
  'use strict';
  const { xml } = C.core;
  const { engine, builder } = C.mapping;
  const { schema } = C.services;

  const specs = {};
  /** Собирает и проверяет спецификацию маппинга для типа клиента (один раз). */
  function specFor(type) {
    if (specs[type]) return specs[type];
    const input = C.model.input.byType[type], rules = C.mapping[type];
    if (!input || !rules) throw new Error(`Нет входной структуры или маппинга для типа «${type}»`);
    const model = schema.getModel();
    const pathOf = C.model.output.clientinfo.resolve(model);
    for (const r of [...rules, ...C.mapping.defaults]) {
      pathOf(r.target);                                                  // алиас выходного поля существует
      const aliases = !r.source ? [] : r.source.kind === 'src' ? r.source.aliases
        : r.source.kind === 'parts' ? r.source.list.flatMap(([, a]) => a) : [];
      for (const a of aliases) {
        if (!input.aliases.has(a)) throw new Error(`Маппинг ${type}: во входной структуре нет колонки «${a}»`);
      }
    }
    return (specs[type] = { type, input, rules, defaults: C.mapping.defaults, model, pathOf });
  }

  /**
   * @param row      строка из services.load
   * @param type     PRSN | BUSN | LEGL
   * @param options  { employee: { lastName, firstName, middleName, position } }
   * @returns {{ id, type, line, fileName, xml, view, issues, xsd: { ok, errors }, ok }}
   *   issues — замечания маппинга [{ level: 'warn'|'error', field, message }]
   *   ok     — XML прошёл XSD и нет ошибок входных данных
   */
  function convert(row, type, options = {}) {
    const spec = specFor(type);
    const { values, issues } = engine.apply(row, spec, options);
    const { tree, view } = builder.build(values, spec.model);
    const text = xml.serialize(tree);
    const xsd = schema.validate(text);
    const id = row['main.userId'] || `строка-${row.$line}`;
    return {
      id, type, line: row.$line,
      title: type === 'LEGL' ? row['main.shortName'] || row['main.fullName'] : [row['main.lastName'], row['main.firstName'], row['main.middleName']].filter(Boolean).join(' '),
      fileName: `${type}_${id.replace(/[^\w.-]+/g, '_')}.xml`,
      xml: text, view, issues, xsd,
      ok: xsd.ok && !issues.some(i => i.level === 'error'),
    };
  }

  /** Конвертирует все строки загруженного файла. */
  const convertAll = (loaded, options) => loaded.rows.map(row => convert(row, loaded.type, options));

  C.services.convert = { convert, convertAll, specFor };
})(globalThis.Comita);
