/* Вкладка «Генератор»: параметры → csv. Файл можно скачать или сразу открыть в конвертере. */
(function (C) {
  'use strict';
  const { h, fill, download } = C.ui.dom;
  const { generate } = C.services.generate;
  const inputs = C.model.input.byType;
  const PREVIEW_ROWS = 20;

  /** @param onOpen  функция ([{ name, text }]) — открыть сгенерированные файлы в конвертере */
  function create({ onOpen }) {
    const type = h('select', {}, Object.values(inputs).map(i => h('option', { value: i.type }, `${i.type} — ${i.title}`)));
    const count = h('input', { type: 'number', min: 1, max: 100000, value: 10 });
    const seed = h('input', { type: 'number', min: 0, value: 1 });
    const dirty = h('input', { type: 'checkbox' });
    const preview = h('div', { class: 'preview' });

    const make = () => generate({
      type: type.value,
      count: Math.max(1, Math.floor(Number(count.value)) || 1),
      seed: Number(seed.value) || 0,
      dirty: dirty.checked,
    });

    function show(file) {
      const table = C.core.csv.parse(file.text);
      const [header, ...rows] = table;
      fill(preview,
        h('p', { class: 'muted' }, `${file.fileName}: строк — ${file.count}, колонок — ${header.length}.`
          + (rows.length > PREVIEW_ROWS ? ` Показаны первые ${PREVIEW_ROWS}.` : '')),
        h('div', { class: 'table-scroll' },
          h('table', { class: 'grid' },
            h('thead', {}, h('tr', {}, header.map(c => h('th', {}, c)))),
            h('tbody', {}, rows.slice(0, PREVIEW_ROWS).map(r => h('tr', {}, r.map(c => h('td', {}, c))))))));
    }

    const root = h('section', { class: 'tab-body' },
      h('div', { class: 'panel form' },
        h('label', {}, 'Тип пользователя', type),
        h('label', {}, 'Количество строк', count),
        h('label', { title: 'Одинаковое зерно в один и тот же день даёт одинаковый файл' }, 'Зерно', seed),
        h('label', { class: 'check', title: 'Счета в формате Excel (4,07E+19), потерянные ведущие нули, адреса одной строкой' }, dirty, 'добавить «грязные» данные'),
        h('div', { class: 'actions' },
          h('button', { class: 'primary', onclick: () => { const f = make(); show(f); download(f.fileName, f.text, 'text/csv;charset=utf-8'); } }, 'Сгенерировать и скачать'),
          h('button', { onclick: () => { const f = make(); show(f); onOpen([{ name: f.fileName, text: f.text }]); } }, 'Открыть в конвертере'))),
      h('p', { class: 'muted note' },
        'Файл повторяет выгрузку системы: UTF-8 с BOM, разделитель «;», те же заголовки и порядок колонок. ',
        'ИНН, ОГРН, ОГРНИП, СНИЛС, ОКПО и расчётные счета — с верными контрольными суммами; паспорт, адрес и даты согласованы между собой.'),
      preview);

    return { root };
  }

  C.ui.generatorView = { create };
})(globalThis.Comita);
