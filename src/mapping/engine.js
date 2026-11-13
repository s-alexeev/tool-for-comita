/* Движок маппинга: строка csv + правила → значения полей выходной структуры.
   Результат — Map «путь в XML → запись»:
     { value: строка | [строки], origin: 'csv' | 'rule' | 'settings' | 'default',
       source: 'main.inn', sourceLabel: 'ИНН', note, rejected }
   Сам XML здесь не строится — это делает mapping/builder.js по XSD-модели. */
(function (C) {
  'use strict';
  const { checkSimple } = C.core.xsdModel;

  const isEmpty = v => v == null || v === '' || (Array.isArray(v) && !v.length);
  const getOption = (options, name) => name.split('.').reduce((o, k) => (o == null ? o : o[k]), options);

  /**
   * @param row      { алиас колонки: значение }
   * @param spec     { type, input (входная структура), rules, defaults, model, pathOf }
   * @param options  настройки конвертера
   * @returns {{ values: Map, issues: [{ level, field, message }] }}
   */
  function apply(row, spec, options = {}) {
    const values = new Map();
    const issues = [];
    const headerOf = alias => (spec.input.columns.find(c => c.alias === alias) || {}).header || alias;

    /** Читает источник правила: { value, origin, source, sourceLabel }. */
    function read(source) {
      if (source.kind === 'const') return { value: source.value, origin: 'rule' };
      if (source.kind === 'opt') return { value: getOption(options, source.name), origin: 'settings', sourceLabel: 'настройки конвертера' };
      if (source.kind === 'parts') {
        const items = source.list.map(([label, aliases]) => ({ label, value: [].concat(aliases).map(a => row[a] || '').filter(Boolean).join(' ') }));
        return { value: items, origin: 'csv', sourceLabel: 'несколько колонок csv' };
      }
      const alias = source.aliases.find(a => !isEmpty(row[a])) || source.aliases[0];
      if (!spec.input.aliases.has(alias)) throw new Error(`Маппинг ${spec.type}: во входной структуре нет колонки «${alias}»`);
      return { value: row[alias], origin: 'csv', source: alias, sourceLabel: headerOf(alias).trim() };
    }

    function put(path, value, entry) {
      if (isEmpty(value) || values.has(path)) return;
      values.set(path, { ...entry, value });
    }

    for (const r of spec.rules) {
      const path = spec.pathOf(r.target);
      if (r.rule === 'required') {
        if (!values.has(path)) issues.push({ level: 'error', field: r.target, message: r.message });
        continue;
      }
      const input = read(r.source);
      if (isEmpty(input.value)) continue;
      const entry = { origin: input.origin, source: input.source, sourceLabel: input.sourceLabel };
      const ctx = {
        row, type: spec.type, options,
        warn: message => { issues.push({ level: 'warn', field: r.target, message }); },
        asDefault: note => { entry.origin = 'default'; entry.note = note; },
      };
      const result = r.transform ? r.transform(input.value, ctx) : input.value;
      if (r.target.endsWith('.*')) {
        for (const [tag, v] of Object.entries(result || {})) put(`${path}/${tag}`, v, entry);
      } else put(path, result, entry);
    }

    for (const d of spec.defaults) {
      if (d.only && !d.only.includes(spec.type)) continue;
      put(spec.pathOf(d.target), d.value, { origin: 'default', note: d.reason });
    }

    fitToSchema(values, spec.model, issues);
    return { values, issues };
  }

  /**
   * Приводит значения к ограничениям XSD: слишком длинный текст обрезается,
   * значение, которое всё равно не проходит по схеме, не выводится. В обоих случаях — предупреждение.
   */
  function fitToSchema(values, model, issues) {
    for (const [path, entry] of values) {
      const decl = model.find(path);
      if (!decl || !decl.simple) throw new Error(`Маппинг: «${path}» не является простым элементом схемы`);
      const name = decl.name;
      const fit = raw => {
        let v = String(raw).replace(/[\r\n]+/g, ' ').trim();
        const tooLong = checkSimple(decl.simple, v).find(p => p.facet === 'maxLength');
        if (tooLong) {
          issues.push({ level: 'warn', field: name, message: `${name}: текст длиннее ${tooLong.limit} символов, обрезан` });
          v = [...v].slice(0, tooLong.limit).join('').trim();
        }
        const problems = checkSimple(decl.simple, v);
        if (!problems.length) return v;
        issues.push({ level: 'warn', field: name, message: `${name}: значение «${v}» ${problems[0].message}, не выведено` });
        entry.rejected = v;
        return undefined;
      };
      const fitted = Array.isArray(entry.value) ? entry.value.map(fit).filter(v => v !== undefined) : fit(entry.value);
      entry.value = isEmpty(fitted) ? undefined : fitted;
    }
  }

  C.mapping.engine = { apply };
})(globalThis.Comita);
