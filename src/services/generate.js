/* Генерация тестового csv: клиенты (generator/entities.js) → строки по описанию колонок (generator/*.gen.js). */
(function (C) {
  'use strict';
  const { csv, random } = C.core;
  const G = C.generator;

  /** Имена файлов выгрузки системы-источника. */
  const FILE_NAMES = {
    PRSN: 'prsn_registered_users_profile_info.csv',
    BUSN: 'busn_registered_users_profile_info.csv',
    LEGL: 'legal_registered_users_profile_info.csv',
  };

  const get = (object, path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), object);

  const plans = {};
  /** Сверяет описание генерации со входной структурой (один раз для типа). */
  function planFor(type) {
    if (plans[type]) return plans[type];
    const input = C.model.input.byType[type], rules = G[type];
    if (!input || !rules) throw new Error(`Нет входной структуры или описания генерации для типа «${type}»`);
    const seen = new Set();
    for (const r of rules) {
      if (!input.aliases.has(r.column)) throw new Error(`Генерация ${type}: во входной структуре нет колонки «${r.column}»`);
      if (seen.has(r.column)) throw new Error(`Генерация ${type}: колонка «${r.column}» описана дважды`);
      seen.add(r.column);
    }
    return (plans[type] = { input, rules });
  }

  /**
   * @param type   PRSN | BUSN | LEGL
   * @param count  число строк (клиентов)
   * @param seed   зерно: одинаковые зерно и дата → одинаковый файл
   * @param dirty  добавить «грязные» значения (generator/dirty.js)
   * @param today  дата, от которой считаются возраст и сроки (по умолчанию — сегодня)
   * @returns {{ fileName, text, count }}
   */
  function generate({ type, count = 10, seed = 1, dirty = false, today = new Date() }) {
    const { input, rules } = planFor(type);
    const rnd = random.create(seed);
    const day = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const table = [input.columns.map(c => c.header)];
    for (let i = 0; i < count; i++) {
      const client = G.entities.client(rnd, type, { today: day });
      const row = Object.fromEntries(rules.map(r => [r.column, get(client, r.from) ?? '']));
      if (dirty) G.dirty.spoil(row, rnd);
      table.push(input.columns.map(c => (c.marker ? '' : row[c.alias] ?? '')));
    }
    return { fileName: FILE_NAMES[type], text: csv.stringify(table), count };
  }

  C.services.generate = { generate, FILE_NAMES };
})(globalThis.Comita);
