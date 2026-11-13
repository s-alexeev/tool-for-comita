/* Загрузка приложения в Node (тесты, cli.js).
   Порядок скриптов берётся из index.html — он единственный источник порядка слоёв.
   Скрипты слоя ui (DOM) не загружаются. */
'use strict';
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
for (const src of scripts) {
  if (!src.startsWith('src/ui/')) require(path.join(__dirname, src));
}

module.exports = globalThis.Comita;
module.exports.scriptList = scripts;
