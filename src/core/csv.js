/* CSV: разбор и запись. Формат выгрузки: UTF-8 с BOM, разделитель «;», CRLF, кавычки по RFC 4180. */
(function (C) {
  'use strict';

  /** Текст → массив строк, каждая строка — массив значений. */
  function parse(text, { delimiter = ';' } = {}) {
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    const rows = [];
    let row = [], field = '', quoted = false, i = 0;
    const endField = () => { row.push(field); field = ''; };
    const endRow = () => { endField(); rows.push(row); row = []; };
    while (i < text.length) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 2; continue; }
        if (ch === '"') { quoted = false; i++; continue; }
        field += ch; i++; continue;
      }
      if (ch === '"' && field === '') { quoted = true; i++; continue; }
      if (ch === delimiter) { endField(); i++; continue; }
      if (ch === '\r' && text[i + 1] === '\n') { endRow(); i += 2; continue; }
      if (ch === '\n' || ch === '\r') { endRow(); i++; continue; }
      field += ch; i++;
    }
    if (field !== '' || row.length) endRow();
    return rows;
  }

  /** Массив строк → текст. */
  function stringify(rows, { delimiter = ';', eol = '\r\n', bom = true } = {}) {
    const needQuotes = new RegExp(`["\\r\\n${delimiter}]`);
    const cell = v => {
      const s = v == null ? '' : String(v);
      return needQuotes.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    return (bom ? '﻿' : '') + rows.map(r => r.map(cell).join(delimiter)).join(eol) + eol;
  }

  C.core.csv = { parse, stringify };
})(globalThis.Comita);
