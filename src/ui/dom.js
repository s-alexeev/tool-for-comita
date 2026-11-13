/* Мелкие помощники для работы с DOM. Только здесь и в остальных файлах ui/ есть обращения к document. */
(function (C) {
  'use strict';

  /**
   * Создаёт элемент: h('button', { class: 'primary', onclick: fn }, 'Текст', дочерний элемент, …).
   * Свойства on* — обработчики событий; false, null и undefined среди атрибутов и детей пропускаются.
   */
  function h(tag, props, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key.startsWith('on')) el.addEventListener(key.slice(2), value);
      else if (key === 'class') el.className = value;
      else if (key in el && key !== 'list') el[key] = value;
      else el.setAttribute(key, value === true ? '' : value);
    }
    el.append(...children.flat(Infinity).filter(c => c != null && c !== false));
    return el;
  }

  /** Заменяет содержимое элемента. */
  function fill(el, ...children) {
    el.replaceChildren(...children.flat(Infinity).filter(c => c != null && c !== false));
    return el;
  }

  /** Отдаёт пользователю файл: content — строка или Uint8Array. */
  function download(fileName, content, mime = 'application/octet-stream') {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const a = h('a', { href: url, download: fileName });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /** Читает файл как текст UTF-8. */
  const readText = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });

  /** Небольшое хранилище настроек; если localStorage недоступен, настройки живут до закрытия страницы. */
  const settings = {
    load(key, fallback) {
      try { return { ...fallback, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch (e) { return { ...fallback }; }
    },
    save(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* хранилище недоступно */ }
    },
  };

  C.ui.dom = { h, fill, download, readText, settings };
})(globalThis.Comita);
