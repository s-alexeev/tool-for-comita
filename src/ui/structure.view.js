/* Экран «Структура»: всё дерево схемы со значениями клиента.
   Показывает каждый элемент XSD (в том числе пустой), его значение и откуда оно взято. */
(function (C) {
  'use strict';
  const { h } = C.ui.dom;

  /** Подпись источника значения. */
  function origin(entry) {
    if (!entry) return null;
    if (entry.rejected !== undefined && entry.value === undefined) {
      return h('span', { class: 'chip bad', title: 'Значение не проходит по схеме и в XML не выведено' }, `не выведено: «${entry.rejected}»`);
    }
    switch (entry.origin) {
      case 'csv':      return h('span', { class: 'chip csv', title: entry.source ? `колонка ${entry.source}` : '' }, `csv: ${entry.sourceLabel}`);
      case 'rule':     return h('span', { class: 'chip rule' }, 'правило системы');
      case 'settings': return h('span', { class: 'chip settings' }, 'настройки');
      case 'default':  return h('span', { class: 'chip default', title: entry.note }, 'по умолчанию');
      default:         return null;
    }
  }

  const title = node => [
    h('span', { class: 'el-name' }, node.name),
    h('span', { class: 'el-card', title: 'кратность по схеме' }, node.card),
    node.doc && h('span', { class: 'el-doc', title: node.doc }, node.doc),
  ];

  function leaf(node) {
    return h('div', { class: 'leaf' + (node.emitted ? '' : ' empty') },
      h('div', { class: 'el-title' }, title(node)),
      h('div', { class: 'el-value' }, node.value || h('span', { class: 'muted' }, '—')),
      h('div', { class: 'el-origin' }, origin(node.entry)),
      h('div', { class: 'el-type muted' }, node.type));
  }

  function group(node, hideEmpty) {
    const children = node.children.map(c => render(c, hideEmpty)).filter(Boolean);
    return h('details', { class: 'group' + (node.emitted ? '' : ' empty'), open: node.emitted },
      h('summary', { class: 'el-title' }, title(node)),
      h('div', { class: 'group-body' }, children));
  }

  /** @param node узел просмотра из mapping/builder.js; hideEmpty — не показывать элементы, которых нет в XML */
  function render(node, hideEmpty = false) {
    if (hideEmpty && !node.emitted) return null;
    return node.leaf ? leaf(node) : group(node, hideEmpty);
  }

  C.ui.structureView = { render };
})(globalThis.Comita);
