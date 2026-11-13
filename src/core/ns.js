/* Пространство имён приложения. Подключается первым.
   Каждый файл src/ — обычный скрипт: (function (C) { ... })(globalThis.Comita).
   Так код работает и по двойному щелчку (file://), и в Node (см. node-loader.js).

   Слои (ссылаться можно только на слои ниже):
     ui → services → mapping, generator → model → core */
(function (root) {
  'use strict';
  root.Comita = root.Comita || {
    core: {},                                   // уровень 0: чистые функции без предметной области
    schemas: {},                                // XSD как строки (генерирует build.js)
    model: { input: {}, output: {}, dict: {} }, // уровень 1: описания структур и справочники
    mapping: {},                                // уровень 2: правила csv → xml
    generator: {},                              // уровень 2: правила генерации csv
    services: {},                               // уровень 3: сценарии
    ui: {},                                     // уровень 4: DOM
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
