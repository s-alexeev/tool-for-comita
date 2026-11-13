/* XML: разбор в дерево и запись дерева в текст.
   Узел: { tag, attrs: {}, children: [], text: '', line, comment? }
   comment — текст XML-комментария, который при записи ставится перед элементом. */
(function (C) {
  'use strict';

  const ENT = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
  const decode = s => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : +e.slice(1));
    if (e in ENT) return ENT[e];
    throw new Error(`XML: неизвестная сущность ${m}`);
  });
  const escapeText = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapeAttr = s => escapeText(s).replace(/"/g, '&quot;');

  const OPEN_TAG = /<([^\s\/>]+)((?:\s+[^\s=\/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/y;

  /** Текст → корневой узел. Комментарии и инструкции обработки пропускаются. */
  function parse(src) {
    let pos = 0, line = 1, counted = 0;
    const lineAt = p => { for (; counted < p; counted++) if (src.charCodeAt(counted) === 10) line++; return line; };
    const fail = msg => { throw new Error(`XML, строка ${lineAt(pos)}: ${msg}`); };
    const skipUntil = (end, what) => {
      const i = src.indexOf(end, pos);
      if (i < 0) fail(`не закрыт ${what}`);
      pos = i + end.length;
    };
    const stack = [];
    let root = null;
    const addText = t => {
      if (stack.length) stack[stack.length - 1].text += t;
      else if (t.trim()) fail('текст вне корневого элемента');
    };
    if (src.charCodeAt(0) === 0xFEFF) pos = 1;
    while (pos < src.length) {
      const lt = src.indexOf('<', pos);
      if (lt < 0) { addText(decode(src.slice(pos))); break; }
      if (lt > pos) addText(decode(src.slice(pos, lt)));
      pos = lt;
      if (src.startsWith('<!--', pos)) { skipUntil('-->', 'комментарий'); continue; }
      if (src.startsWith('<?', pos)) { skipUntil('?>', 'инструкция обработки'); continue; }
      if (src.startsWith('<![CDATA[', pos)) {
        const end = src.indexOf(']]>', pos);
        if (end < 0) fail('не закрыт CDATA');
        addText(src.slice(pos + 9, end)); pos = end + 3; continue;
      }
      if (src.startsWith('<!', pos)) { skipUntil('>', 'DOCTYPE'); continue; }
      if (src[pos + 1] === '/') {
        const end = src.indexOf('>', pos);
        if (end < 0) fail('не закрыт тег');
        const name = src.slice(pos + 2, end).trim();
        const open = stack.pop();
        if (!open || open.tag !== name) fail(`закрывающий тег </${name}> не соответствует <${open ? open.tag : '?'}>`);
        pos = end + 1; continue;
      }
      OPEN_TAG.lastIndex = pos;
      const m = OPEN_TAG.exec(src);
      if (!m) fail('некорректный тег');
      const node = { tag: m[1], attrs: {}, children: [], text: '', line: lineAt(pos) };
      for (const a of m[2].matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) node.attrs[a[1]] = decode(a[2] ?? a[3]);
      if (stack.length) stack[stack.length - 1].children.push(node);
      else if (root) fail('несколько корневых элементов');
      else root = node;
      if (!m[3]) stack.push(node);
      pos += m[0].length;
    }
    if (stack.length) fail(`не закрыт элемент <${stack[stack.length - 1].tag}>`);
    if (!root) fail('нет корневого элемента');
    return root;
  }

  /** Дерево → текст с отступами. */
  function serialize(root, { indent = '  ', declaration = true } = {}) {
    const out = declaration ? ['<?xml version="1.0" encoding="UTF-8"?>'] : [];
    (function write(n, pad) {
      if (n.comment) out.push(`${pad}<!-- ${String(n.comment).replace(/--/g, '—')} -->`);
      const attrs = Object.entries(n.attrs || {}).map(([k, v]) => ` ${k}="${escapeAttr(v)}"`).join('');
      const kids = n.children || [];
      if (kids.length) {
        out.push(`${pad}<${n.tag}${attrs}>`);
        kids.forEach(k => write(k, pad + indent));
        out.push(`${pad}</${n.tag}>`);
      } else if (n.text != null && n.text !== '') out.push(`${pad}<${n.tag}${attrs}>${escapeText(n.text)}</${n.tag}>`);
      else out.push(`${pad}<${n.tag}${attrs}/>`);
    })(root, '');
    return out.join('\n') + '\n';
  }

  C.core.xml = { parse, serialize, escapeText };
})(globalThis.Comita);
