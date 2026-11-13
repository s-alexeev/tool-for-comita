/* Выгрузка результатов конвертации: содержимое файлов (без работы с DOM). */
(function (C) {
  'use strict';
  const { zip, csv } = C.core;

  /** ZIP со всеми XML и отчётом. @returns {Uint8Array} */
  function archive(results) {
    return zip.build([
      ...results.map(r => ({ name: r.fileName, text: r.xml })),
      { name: 'отчёт.csv', text: report(results) },
    ]);
  }

  /** Отчёт csv: по строке на каждое замечание и на каждого клиента без замечаний. */
  function report(results) {
    const rows = [['Файл XML', 'Тип', 'Идентификатор', 'Клиент', 'Проверка XSD', 'Вид замечания', 'Поле', 'Замечание']];
    for (const r of results) {
      const head = [r.fileName, r.type, r.id, r.title, r.xsd.ok ? 'пройдена' : 'не пройдена'];
      const notes = [
        ...r.xsd.errors.map(e => ['ошибка XSD', e.path, e.message]),
        ...r.issues.map(i => [i.level === 'error' ? 'ошибка данных' : 'предупреждение', i.field, i.message]),
      ];
      if (!notes.length) rows.push([...head, '', '', '']);
      for (const n of notes) rows.push([...head, ...n]);
    }
    return csv.stringify(rows);
  }

  C.services.exporter = { archive, report };
})(globalThis.Comita);
