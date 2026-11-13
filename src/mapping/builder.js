/* Построитель: значения полей + XSD-модель → XML-дерево и дерево для просмотра.
   Порядок и состав элементов задаёт только схема, порядок правил маппинга на них не влияет.

   Правило вывода в XML: элемент выводится, если у него есть значение (или значения в поддереве)
   либо если его требует схема (minOccurs ≥ 1 внутри выводимого родителя). На экране «Структура»
   видны все элементы схемы, включая пустые. */
(function (C) {
  'use strict';
  const { describeSimple } = C.core.xsdModel;

  const card = d => `${d.min}..${d.max === Infinity ? '*' : d.max}`;

  /**
   * @returns {{ tree: узел XML, view: узел просмотра }}
   * Узел просмотра: { name, path, doc, card, type, leaf, value, entry, emitted, children }
   */
  function build(values, model) {
    const valuePaths = [...values].filter(([, e]) => e.value !== undefined).map(([p]) => p);
    const hasData = decl => valuePaths.some(p => p === decl.path || p.startsWith(decl.path + '/'));

    function element(decl, parentEmitted) {
      const view = { name: decl.name, path: decl.path, doc: decl.doc, card: card(decl), leaf: !!decl.simple, children: [] };
      if (decl.simple) {
        const entry = values.get(decl.path);
        const list = entry && entry.value !== undefined ? [].concat(entry.value) : [];
        Object.assign(view, { type: describeSimple(decl.simple), entry, value: list.join(' | '), emitted: list.length > 0 });
        const comment = entry && entry.origin === 'default' ? `значение по умолчанию: ${entry.note}` : undefined;
        return { view, nodes: list.map(text => ({ tag: decl.name, attrs: {}, children: [], text, comment })) };
      }
      const emitted = hasData(decl) || (parentEmitted && decl.min >= 1 && !decl.inChoice);
      const choiceMade = decl.children.some(c => c.inChoice && hasData(c));
      const node = { tag: decl.name, attrs: {}, children: [], text: '' };
      for (const child of decl.children) {
        if (child.inChoice && choiceMade && !hasData(child)) continue;   // невыбранная альтернатива xs:choice
        const built = element(child, emitted);
        view.children.push(built.view);
        node.children.push(...built.nodes);
      }
      view.emitted = emitted;
      return { view, nodes: emitted ? [node] : [] };
    }

    const { view, nodes } = element(model.root, true);
    return { tree: nodes[0], view };
  }

  C.mapping.builder = { build };
})(globalThis.Comita);
