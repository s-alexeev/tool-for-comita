/* Проверка XML-дерева по модели схемы (core/xsd-model.js).
   Результат — список ошибок [{ path, line, message }]; пустой список означает «документ валиден».
   Совпадение вердикта с libxml2 (xmllint) проверяется тестом tests/parity.test.js. */
(function (C) {
  'use strict';
  const { checkSimple } = C.core.xsdModel;

  /** Имена элементов, с которых может начинаться частица. */
  function firstNames(p) {
    if (p.kind === 'element') return [p.decl.name];
    if (p.kind === 'choice') return p.items.flatMap(firstNames);
    const names = [];
    for (const it of p.items) { names.push(...firstNames(it)); if (!nullable(it)) break; }
    return names;
  }
  /** Может ли частица не занять ни одного элемента. */
  function nullable(p) {
    if (p.kind === 'element') return p.decl.min === 0;
    if (p.min === 0) return true;
    return p.kind === 'choice' ? p.items.some(nullable) : p.items.every(nullable);
  }

  function validate(root, model) {
    const errors = [];
    const err = (node, path, message) => errors.push({ path, line: node.line, message });

    if (root.tag !== model.root.name) {
      err(root, root.tag, `Корневой элемент «${root.tag}» не объявлен в схеме, ожидается «${model.root.name}»`);
      return errors;
    }
    element(root, model.root, model.root.name);
    return errors;

    function element(node, decl, path) {
      for (const a of Object.keys(node.attrs || {})) {
        if (!/^xmlns(:|$)|^xsi:/.test(a)) err(node, path, `Атрибут «${a}» не объявлен в схеме`);
      }
      if (decl.simple) {
        if (node.children.length) return err(node, path, `Элемент «${node.tag}» должен содержать только текст`);
        for (const p of checkSimple(decl.simple, node.text)) err(node, path, `Элемент «${node.tag}»: значение «${node.text}» ${p.message}`);
        return;
      }
      if (node.text.trim()) err(node, path, `Элемент «${node.tag}» не может содержать текст`);
      const list = node.children;
      let i = decl.content ? particle(decl.content, 0) : 0;
      if (i < list.length) {
        const expected = decl.content ? firstNames(decl.content) : [];
        err(list[i], `${path}/${list[i].tag}`, `Элемент «${list[i].tag}» здесь не ожидается` +
          (decl.children.some(c => c.name === list[i].tag) ? ' (нарушен порядок или кратность)' : ' (не объявлен в схеме)') +
          (expected.length ? `. Состав «${node.tag}» по схеме: ${decl.children.map(c => c.name).join(', ')}` : ''));
      }

      /** Сопоставляет частицу с элементами начиная с позиции i, возвращает новую позицию. */
      function particle(p, i) {
        if (p.kind === 'element') {
          let n = 0;
          while (i < list.length && list[i].tag === p.decl.name && n < p.decl.max) {
            element(list[i], p.decl, `${path}/${list[i].tag}`); i++; n++;
          }
          if (n < p.decl.min) err(node, path, `В элементе «${node.tag}» отсутствует обязательный элемент «${p.decl.name}»`);
          return i;
        }
        const first = firstNames(p);
        for (let rep = 0; rep < p.max; rep++) {
          const canStart = i < list.length && first.includes(list[i].tag);
          if (!canStart && (rep >= p.min || nullable(p))) break;
          const start = i;
          if (p.kind === 'sequence') {
            for (const it of p.items) i = particle(it, i);
          } else {
            const alt = canStart && p.items.find(it => firstNames(it).includes(list[i].tag));
            if (alt) i = particle(alt, i);
            else { err(node, path, `В элементе «${node.tag}» должен быть один из элементов: ${first.join(', ')}`); break; }
          }
          if (i === start) break;
        }
        return i;
      }
    }
  }

  C.core.xsdValidate = { validate };
})(globalThis.Comita);
