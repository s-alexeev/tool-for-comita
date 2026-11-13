#!/usr/bin/env node
/* Сборка.
   1. schemas/clientinfo.xsd.js — текст объединённой схемы как JS-строка (скрипты не могут читать файлы с file://).
   2. dist/index.html — всё приложение одним файлом: его можно переслать и открыть двойным щелчком.
   Для разработки сборка не нужна: index.html в корне подключает скрипты из src/ напрямую. */
'use strict';
const fs = require('fs');
const path = require('path');
const at = (...p) => path.join(__dirname, ...p);

const xsd = fs.readFileSync(at('schemas', 'CLIENTINFO_merged.xsd'), 'utf8');
fs.writeFileSync(at('schemas', 'clientinfo.xsd.js'),
  '/* Сгенерировано build.js из schemas/CLIENTINFO_merged.xsd. Не редактировать вручную. */\n' +
  `globalThis.Comita.schemas.clientinfo = ${JSON.stringify(xsd)};\n`);

const safe = s => s.replace(/<\/script/gi, '<\\/script');
let html = fs.readFileSync(at('index.html'), 'utf8');
let count = 0;
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  count++;
  return `<script>/* ${src} */\n${safe(fs.readFileSync(at(src), 'utf8'))}</script>`;
});
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, href) => `<style>\n${fs.readFileSync(at(href), 'utf8')}</style>`);
fs.mkdirSync(at('dist'), { recursive: true });
fs.writeFileSync(at('dist', 'index.html'), html);
console.log(`schemas/clientinfo.xsd.js обновлён; dist/index.html: ${count} скриптов, ${(html.length / 1024).toFixed(0)} КБ`);
