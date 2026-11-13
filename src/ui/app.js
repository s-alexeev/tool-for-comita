/* Точка входа интерфейса: вкладки и связь между ними. */
(function (C) {
  'use strict';
  const { h } = C.ui.dom;

  function start() {
    const converter = C.ui.converterView.create();
    const generator = C.ui.generatorView.create({
      onOpen: files => { converter.openFiles(files); select('converter'); },
    });
    const tabs = [
      { key: 'generator', title: 'Генератор csv', view: generator },
      { key: 'converter', title: 'Конвертер csv → XML', view: converter },
    ];

    const buttons = tabs.map(t => h('button', { class: 'tab', onclick: () => select(t.key) }, t.title));
    function select(key) {
      tabs.forEach((t, i) => {
        t.view.root.hidden = t.key !== key;
        buttons[i].classList.toggle('active', t.key === key);
      });
    }

    document.body.append(
      h('header', { class: 'top' }, h('h1', {}, 'Карточка клиента'), h('nav', {}, buttons)),
      h('main', {}, tabs.map(t => t.view.root)));
    select('converter');
  }

  try { start(); }
  catch (e) {
    document.body.append(h('pre', { class: 'fatal' }, `Приложение не запустилось: ${e.message}`));
    throw e;
  }
})(globalThis.Comita);
