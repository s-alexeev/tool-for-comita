/* Загрузка входных данных: текст csv → тип пользователя и строки { алиас колонки: значение }. */
(function (C) {
  'use strict';
  const { csv } = C.core;
  const inputs = C.model.input.byType;

  const same = (a, b) => String(a ?? '').trim() === String(b ?? '').trim();

  /** Определяет входную структуру по строке заголовков: та, у которой совпало больше заголовков. */
  function detect(header) {
    const scored = Object.values(inputs).map(def => ({
      def,
      matched: def.columns.filter(c => same(header[c.index], c.header)).length,
    })).sort((a, b) => b.matched / b.def.columns.length - a.matched / a.def.columns.length);
    return scored[0].matched / scored[0].def.columns.length >= 0.8 ? scored[0].def : null;
  }

  /**
   * @returns {{ type, input, rows: [{ $line, алиас: значение }], issues: [{ level, line, message }] }}
   * type === null, если формат файла не распознан (тогда rows пуст).
   */
  function load(text, fileName = '') {
    const issues = [];
    const table = csv.parse(text);
    const where = fileName ? `${fileName}: ` : '';
    if (!table.length) return { type: null, input: null, rows: [], issues: [{ level: 'error', line: 0, message: `${where}файл пуст` }] };

    const [header, ...lines] = table;
    const input = detect(header);
    if (!input) {
      return { type: null, input: null, rows: [], issues: [{ level: 'error', line: 1, message: `${where}заголовок не соответствует ни одному формату выгрузки (PRSN, BUSN, LEGL)` }] };
    }
    for (const c of input.columns) {
      if (!same(header[c.index], c.header)) {
        issues.push({ level: 'error', line: 1, message: `${where}колонка ${c.index + 1}: ожидался заголовок «${c.header.trim()}», получен «${header[c.index] ?? ''}»` });
      }
    }
    if (header.length > input.columns.length) {
      issues.push({ level: 'warn', line: 1, message: `${where}лишние колонки (${header.length - input.columns.length}) после колонки ${input.columns.length} не используются` });
    }

    const typeColumn = input.columns.find(c => c.alias === 'main.userType');
    const rows = [];
    lines.forEach((cells, i) => {
      const line = i + 2;
      if (cells.every(v => v.trim() === '')) return;
      if (cells.length < input.columns.length) {
        issues.push({ level: 'error', line, message: `${where}строка ${line}: ${cells.length} колонок вместо ${input.columns.length}, строка пропущена` });
        return;
      }
      if (!same(cells[typeColumn.index], input.type)) {
        issues.push({ level: 'error', line, message: `${where}строка ${line}: тип пользователя «${cells[typeColumn.index]}» не соответствует формату файла ${input.type}, строка пропущена` });
        return;
      }
      const row = { $line: line };
      for (const c of input.columns) if (!c.marker) row[c.alias] = cells[c.index].trim();
      rows.push(row);
    });
    return { type: input.type, input, rows, issues };
  }

  C.services.load = { load };
})(globalThis.Comita);
