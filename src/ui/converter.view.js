/* Вкладка «Конвертер»: csv → список клиентов → структура, XML и замечания по каждому.
   Вся работа с данными — в services/*; здесь только состояние экрана и отрисовка. */
(function (C) {
  'use strict';
  const { h, fill, download, readText, settings } = C.ui.dom;
  const { load } = C.services.load;
  const { convertAll } = C.services.convert;
  const exporter = C.services.exporter;

  const LIST_LIMIT = 500;
  const SETTINGS_KEY = 'comita.employee';
  const EMPLOYEE_FIELDS = [
    ['lastName', 'Фамилия'], ['firstName', 'Имя'], ['middleName', 'Отчество'], ['position', 'Должность'],
  ];
  const FILTERS = [
    ['all', 'все', () => true],
    ['bad', 'с ошибками', r => !r.ok],
    ['warn', 'с предупреждениями', r => r.issues.some(i => i.level === 'warn')],
  ];

  const warnings = r => r.issues.filter(i => i.level === 'warn').length;
  const errors = r => r.xsd.errors.length + r.issues.filter(i => i.level === 'error').length;

  /** XML с простой подсветкой: комментарии и теги. */
  function highlight(xml) {
    const pre = h('pre', { class: 'xml' });
    for (const part of xml.split(/(<!--[\s\S]*?-->|<[^>]+>)/)) {
      if (!part) continue;
      const kind = part.startsWith('<!--') ? 'x-comment' : part.startsWith('<') ? 'x-tag' : '';
      pre.append(kind ? h('span', { class: kind }, part) : part);
    }
    return pre;
  }

  function create() {
    const state = {
      files: [],            // [{ name, text }] — загруженные csv, чтобы пересчитать при смене настроек
      loadIssues: [],       // замечания к файлам целиком
      results: [],          // результаты services.convert
      selected: null,       // выбранный результат
      filter: 'all',
      tab: 'structure',
      hideEmpty: false,
      employee: settings.load(SETTINGS_KEY, { lastName: '', firstName: '', middleName: '', position: '' }),
    };

    const summary = h('div', { class: 'summary' });
    const list = h('div', { class: 'client-list' });
    const detail = h('div', { class: 'detail' });
    const fileIssues = h('div', {});
    const picker = h('input', { type: 'file', accept: '.csv,text/csv', multiple: true, hidden: true,
      onchange: e => { openFiles([...e.target.files]); e.target.value = ''; } });

    // ---------- данные ----------
    function recalculate() {
      state.loadIssues = [];
      state.results = [];
      for (const f of state.files) {
        const loaded = load(f.text, f.name);
        state.loadIssues.push(...loaded.issues);
        if (loaded.type) state.results.push(...convertAll(loaded, { employee: state.employee }));
      }
      const keep = state.selected && state.results.find(r => r.id === state.selected.id && r.type === state.selected.type);
      state.selected = keep || state.results[0] || null;
      render();
    }

    /** Открывает csv: массив File или готовых { name, text }. */
    async function openFiles(files) {
      state.files = await Promise.all(files.map(async f => (f.text && typeof f.text === 'string' ? f : { name: f.name, text: await readText(f) })));
      recalculate();
    }

    // ---------- отрисовка ----------
    function renderSummary() {
      const n = state.results.length;
      if (!state.files.length) return fill(summary);
      const ok = state.results.filter(r => r.ok).length;
      const withWarnings = state.results.filter(r => warnings(r)).length;
      fill(summary,
        h('span', {}, `Файлов: ${state.files.length}. Клиентов: ${n}.`),
        h('span', { class: ok === n ? 'good' : 'bad-text' }, `Прошли проверку: ${ok} из ${n}.`),
        h('span', { class: withWarnings ? 'warn-text' : '' }, `С предупреждениями: ${withWarnings}.`),
        h('span', { class: 'spacer' }),
        h('button', { disabled: !n, onclick: () => download('clientinfo_xml.zip', exporter.archive(state.results), 'application/zip') }, 'Скачать все XML (zip)'),
        h('button', { disabled: !n, onclick: () => download('отчёт.csv', exporter.report(state.results), 'text/csv;charset=utf-8') }, 'Отчёт (csv)'));
    }

    function renderFileIssues() {
      fill(fileIssues, state.loadIssues.length > 0 && h('div', { class: 'panel issues' },
        h('h3', {}, 'Замечания к файлам'),
        h('ul', {}, state.loadIssues.map(i => h('li', { class: i.level }, i.message)))));
    }

    function renderList() {
      const test = FILTERS.find(f => f[0] === state.filter)[2];
      const shown = state.results.filter(test);
      fill(list,
        h('div', { class: 'filters' }, FILTERS.map(([key, label, fn]) =>
          h('button', { class: 'pill' + (state.filter === key ? ' active' : ''), onclick: () => { state.filter = key; renderList(); } },
            `${label} ${state.results.filter(fn).length}`))),
        shown.slice(0, LIST_LIMIT).map(r => h('button', {
          class: 'client' + (r === state.selected ? ' active' : ''),
          onclick: () => { state.selected = r; renderList(); renderDetail(); },
        },
          h('span', { class: 'mark ' + (r.ok ? 'good' : 'bad-text'), title: r.ok ? 'XML прошёл проверку по XSD' : 'есть ошибки' }, r.ok ? '✓' : '✗'),
          h('span', { class: 'client-title' }, r.title || r.id, h('small', {}, `${r.type} · ${r.id}`)),
          warnings(r) > 0 && h('span', { class: 'badge', title: 'предупреждения' }, warnings(r)))),
        shown.length > LIST_LIMIT && h('p', { class: 'muted' }, `Показаны первые ${LIST_LIMIT} из ${shown.length}. В архив и отчёт попадают все.`),
        !shown.length && state.results.length > 0 && h('p', { class: 'muted' }, 'Нет клиентов с таким признаком.'));
    }

    function renderIssues(r) {
      const items = [
        ...r.xsd.errors.map(e => ({ level: 'error', label: 'XSD', text: `${e.message}${e.line ? ` (строка ${e.line} XML)` : ''}`, where: e.path })),
        ...r.issues.filter(i => i.level === 'error').map(i => ({ level: 'error', label: 'данные', text: i.message, where: i.field })),
        ...r.issues.filter(i => i.level === 'warn').map(i => ({ level: 'warn', label: 'предупреждение', text: i.message, where: i.field })),
      ];
      if (!items.length) return h('p', { class: 'good' }, 'XML соответствует XSD, замечаний нет.');
      return h('div', {},
        h('p', { class: r.xsd.ok ? 'good' : 'bad-text' }, r.xsd.ok ? 'XML соответствует XSD.' : `XML не соответствует XSD: ошибок — ${r.xsd.errors.length}.`),
        h('ul', { class: 'issue-list' }, items.map(i => h('li', { class: i.level },
          h('span', { class: 'chip ' + (i.level === 'error' ? 'bad' : 'default') }, i.label), ' ', i.text))));
    }

    function renderDetail() {
      const r = state.selected;
      if (!r) return fill(detail, state.files.length ? h('p', { class: 'muted' }, 'В файлах нет строк для конвертации.') : null);
      const tabs = [
        ['structure', 'Структура'],
        ['xml', 'XML'],
        ['issues', `Проверка${errors(r) + warnings(r) ? ` (${errors(r) + warnings(r)})` : ''}`],
      ];
      const body = state.tab === 'xml' ? highlight(r.xml)
        : state.tab === 'issues' ? renderIssues(r)
        : h('div', {},
            h('label', { class: 'check' },
              h('input', { type: 'checkbox', checked: state.hideEmpty, onchange: e => { state.hideEmpty = e.target.checked; renderDetail(); } }),
              'только то, что попало в XML'),
            h('div', { class: 'tree' }, C.ui.structureView.render(r.view, state.hideEmpty)));
      fill(detail,
        h('div', { class: 'detail-head' },
          h('h2', {}, r.title || r.id),
          h('span', { class: 'chip ' + (r.ok ? 'ok' : 'bad') }, r.ok ? 'проверка пройдена' : 'есть ошибки'),
          h('span', { class: 'muted' }, `строка ${r.line} csv`),
          h('span', { class: 'spacer' }),
          h('button', { onclick: () => download(r.fileName, r.xml, 'application/xml') }, 'Скачать XML')),
        h('div', { class: 'subtabs' }, tabs.map(([key, label]) =>
          h('button', { class: 'pill' + (state.tab === key ? ' active' : ''), onclick: () => { state.tab = key; renderDetail(); } }, label))),
        body);
    }

    function render() { renderSummary(); renderFileIssues(); renderList(); renderDetail(); }

    // ---------- настройки: сотрудник, заполнивший карточку ----------
    const employeeForm = h('details', { class: 'panel' },
      h('summary', {}, 'Сотрудник, заполнивший карточку (в csv его нет)'),
      h('div', { class: 'form' }, EMPLOYEE_FIELDS.map(([key, label]) =>
        h('label', {}, label, h('input', { type: 'text', value: state.employee[key], onchange: e => {
          state.employee[key] = e.target.value.trim();
          settings.save(SETTINGS_KEY, state.employee);
          if (state.files.length) recalculate();
        } })))));

    const drop = h('div', { class: 'drop',
      ondragover: e => { e.preventDefault(); drop.classList.add('over'); },
      ondragleave: () => drop.classList.remove('over'),
      ondrop: e => { e.preventDefault(); drop.classList.remove('over'); openFiles([...e.dataTransfer.files]); },
    },
      h('button', { class: 'primary', onclick: () => picker.click() }, 'Выбрать csv'),
      h('span', { class: 'muted' }, 'или перетащите сюда файлы выгрузки PRSN, BUSN, LEGL — можно несколько сразу'),
      picker);

    const root = h('section', { class: 'tab-body' },
      drop, employeeForm, summary, fileIssues,
      h('div', { class: 'split' }, list, detail));

    return { root, openFiles };
  }

  C.ui.converterView = { create };
})(globalThis.Comita);
