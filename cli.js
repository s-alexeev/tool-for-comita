#!/usr/bin/env node
/* Командная строка: те же сервисы, что и в браузере.
     node cli.js generate PRSN 100 [--seed 1] [--dirty] [--out файл.csv]
     node cli.js convert файл.csv [--out папка] */
'use strict';
const fs = require('fs');
const path = require('path');
const C = require('./node-loader.js');

const [command, ...rest] = process.argv.slice(2);
const flag = name => { const i = rest.indexOf(`--${name}`); return i < 0 ? undefined : rest[i + 1] ?? true; };

if (command === 'generate') {
  const file = C.services.generate.generate({ type: String(rest[0]).toUpperCase(), count: Number(rest[1]) || 10, seed: Number(flag('seed')) || 1, dirty: rest.includes('--dirty') });
  const out = flag('out') || file.fileName;
  fs.writeFileSync(out, file.text);
  console.log(`${out}: строк — ${file.count}`);
} else if (command === 'convert') {
  const loaded = C.services.load.load(fs.readFileSync(rest[0], 'utf8'), path.basename(rest[0]));
  loaded.issues.forEach(i => console.log(`${i.level}: ${i.message}`));
  const results = C.services.convert.convertAll(loaded);
  const out = flag('out') || 'xml';
  fs.mkdirSync(out, { recursive: true });
  for (const r of results) fs.writeFileSync(path.join(out, r.fileName), r.xml);
  fs.writeFileSync(path.join(out, 'отчёт.csv'), C.services.exporter.report(results));
  console.log(`${out}: клиентов — ${results.length}, прошли проверку — ${results.filter(r => r.ok).length}`);
  process.exitCode = results.every(r => r.ok) && loaded.type ? 0 : 1;
} else {
  console.log('node cli.js generate PRSN|BUSN|LEGL <строк> [--seed N] [--dirty] [--out файл.csv]\nnode cli.js convert <файл.csv> [--out папка]');
}
