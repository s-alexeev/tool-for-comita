/* XSD → модель схемы. Единственный источник структуры выходного XML:
   её используют построитель XML, валидатор, дерево «Структура» в UI и (этап 2) диаграммы.

   Поддерживается подмножество XSD 1.0, которого достаточно для «Карточки клиента»:
   include, element, complexType (sequence/choice), simpleType (restriction от xs:string:
   pattern, enumeration, length, minLength, maxLength), minOccurs/maxOccurs, annotation.
   Любая другая конструкция даёт явную ошибку, а не молчаливый пропуск.

   Объявление элемента (ElementDecl):
     { name, path, min, max, doc, inChoice,
       simple:  null | { name, steps: [{ patterns, enums, length, minLength, maxLength }] },
       content: null | Particle,           // модель содержимого для валидатора
       children: [ElementDecl] }           // те же элементы плоским списком в порядке схемы
   Particle: { kind: 'element', decl } | { kind: 'sequence'|'choice', min, max, items: [Particle] } */
(function (C) {
  'use strict';
  const { xml } = C.core;

  const local = t => t.replace(/^[^:]*:/, '');
  const occurs = (n, k) => (n.attrs[k] === undefined ? 1 : n.attrs[k] === 'unbounded' ? Infinity : +n.attrs[k]);
  const unsupported = (what, n) => { throw new Error(`XSD, строка ${n.line}: конструкция «${what}» не поддерживается`); };
  const kids = (n, ...names) => n.children.filter(c => names.includes(local(c.tag)));
  const docOf = n => kids(n, 'annotation').flatMap(a => kids(a, 'documentation')).map(d => d.text.trim()).join(' ');

  /**
   * @param {string} xsdText  текст главной схемы
   * @param {{includes?: Object<string,string>}} [opt]  тексты схем для xs:include по имени файла
   */
  function build(xsdText, opt = {}) {
    const top = [];
    (function load(text) {
      const doc = xml.parse(text);
      if (local(doc.tag) !== 'schema') throw new Error('XSD: корневой элемент должен быть xs:schema');
      for (const c of doc.children) {
        if (local(c.tag) !== 'include') { top.push(c); continue; }
        const inc = (opt.includes || {})[c.attrs.schemaLocation];
        if (inc == null) throw new Error(`XSD: не передана включаемая схема «${c.attrs.schemaLocation}»`);
        load(inc);
      }
    })(xsdText);

    const simpleSrc = {}, complexSrc = {}, simpleCache = {};
    let rootSrc = null;
    for (const c of top) {
      const k = local(c.tag);
      if (k === 'simpleType') simpleSrc[c.attrs.name] = c;
      else if (k === 'complexType') complexSrc[c.attrs.name] = c;
      else if (k === 'element') { if (rootSrc) unsupported('несколько корневых элементов', c); rootSrc = c; }
      else if (k !== 'annotation') unsupported(c.tag, c);
    }
    if (!rootSrc) throw new Error('XSD: не найден корневой элемент');

    // ---------- простые типы ----------
    function simpleType(node, name) {
      const r = kids(node, 'restriction')[0];
      if (!r) unsupported('simpleType без restriction', node);
      const step = { patterns: [], enums: [] };
      for (const f of r.children) {
        const k = local(f.tag), v = f.attrs.value;
        if (k === 'pattern') step.patterns.push(v);
        else if (k === 'enumeration') step.enums.push(v);
        else if (k === 'length' || k === 'minLength' || k === 'maxLength') step[k] = +v;
        else if (k === 'simpleType' || k === 'annotation') continue;
        else unsupported(f.tag, f);
      }
      const inner = kids(r, 'simpleType')[0];
      const base = inner ? simpleType(inner, null) : namedSimple(r.attrs.base, r);
      return { name: name || base.name, steps: [...base.steps, step] };
    }
    function namedSimple(typeName, at) {
      const n = local(typeName);
      if (simpleSrc[n]) return simpleCache[n] || (simpleCache[n] = simpleType(simpleSrc[n], n));
      if (/^xsd?:string$/.test(typeName)) return { name: 'string', steps: [] };
      return unsupported(`тип ${typeName}`, at);
    }

    // ---------- элементы и сложные типы ----------
    function element(node, parentPath, inChoice) {
      const name = node.attrs.name;
      if (!name) unsupported('element без name (ref)', node);
      const decl = {
        name, path: parentPath ? `${parentPath}/${name}` : name,
        min: occurs(node, 'minOccurs'), max: occurs(node, 'maxOccurs'),
        doc: docOf(node), inChoice, simple: null, content: null, children: [],
      };
      const inlineComplex = kids(node, 'complexType')[0], inlineSimple = kids(node, 'simpleType')[0];
      const typeName = node.attrs.type && local(node.attrs.type);
      const complex = inlineComplex || (typeName && complexSrc[typeName]);
      if (complex) {
        decl.typeName = typeName || null;
        if (!decl.doc) decl.doc = docOf(complex);
        const groups = kids(complex, 'sequence', 'choice');
        for (const c of complex.children) if (!['sequence', 'choice', 'annotation'].includes(local(c.tag))) unsupported(c.tag, c);
        if (groups.length > 1) unsupported('несколько групп в complexType', complex);
        if (groups.length) decl.content = particle(groups[0], decl, false);
      } else {
        decl.simple = inlineSimple ? simpleType(inlineSimple, null) : namedSimple(node.attrs.type || 'xs:string', node);
      }
      return decl;
    }
    function particle(node, owner, inChoice) {
      const kind = local(node.tag);
      const p = { kind, min: occurs(node, 'minOccurs'), max: occurs(node, 'maxOccurs'), items: [] };
      for (const c of node.children) {
        const k = local(c.tag);
        if (k === 'element') {
          const decl = element(c, owner.path, inChoice || kind === 'choice');
          owner.children.push(decl);
          p.items.push({ kind: 'element', decl });
        } else if (k === 'sequence' || k === 'choice') p.items.push(particle(c, owner, inChoice || kind === 'choice'));
        else if (k !== 'annotation') unsupported(c.tag, c);
      }
      return p;
    }

    const root = element(rootSrc, '', false);
    const index = new Map();
    (function walk(d) { index.set(d.path, d); d.children.forEach(walk); })(root);
    return {
      root,
      /** Объявление элемента по пути «СведКлиент/ИнфКлиент/…» или undefined. */
      find: path => index.get(path),
      paths: () => [...index.keys()],
    };
  }

  // ---------- проверка значения простого типа ----------
  const patternCache = new Map();
  const patternRe = p => patternCache.get(p) || patternCache.set(p, new RegExp(`^(?:${p})$`)).get(p);

  /** Возвращает список нарушений: [{ facet, message }]. Пустой список — значение допустимо. */
  function checkSimple(simple, value) {
    const problems = [], len = [...value].length;
    for (const s of simple.steps) {
      if (s.length !== undefined && len !== s.length) problems.push({ facet: 'length', limit: s.length, message: `длина ${len}, требуется ровно ${s.length}` });
      if (s.minLength !== undefined && len < s.minLength) problems.push({ facet: 'minLength', limit: s.minLength, message: `длина ${len} меньше минимальной ${s.minLength}` });
      if (s.maxLength !== undefined && len > s.maxLength) problems.push({ facet: 'maxLength', limit: s.maxLength, message: `длина ${len} больше максимальной ${s.maxLength}` });
      if (s.patterns.length && !s.patterns.some(p => patternRe(p).test(value))) problems.push({ facet: 'pattern', message: `не соответствует шаблону «${s.patterns.join('» | «')}»` });
      if (s.enums.length && !s.enums.includes(value)) problems.push({ facet: 'enumeration', message: `нет среди допустимых значений (${s.enums.join(', ')})` });
    }
    return problems;
  }

  /** Краткое описание ограничений типа для UI: «0|1», «до 250 симв.». */
  function describeSimple(simple) {
    const parts = [];
    let min, max;
    for (const s of simple.steps) {
      if (s.patterns.length) parts.push(s.patterns.join(' | '));
      if (s.enums.length) parts.push(s.enums.join(', '));
      if (s.minLength !== undefined) min = Math.max(min ?? 0, s.minLength);
      if (s.maxLength !== undefined) max = Math.min(max ?? Infinity, s.maxLength);
      if (s.length !== undefined) min = max = s.length;
    }
    if (max !== undefined) parts.push(min === max ? `${max} симв.` : `${min ?? 0}–${max} симв.`);
    return parts.join('; ');
  }

  C.core.xsdModel = { build, checkSimple, describeSimple };
})(globalThis.Comita);
