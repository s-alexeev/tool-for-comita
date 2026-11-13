/* Язык описания маппинга. Одно правило — одна строка:

     map('fl.inn',  src('main.inn'),  t.inn(12))
          │          │                 └─ преобразование (необязательно): (значение, ctx) → значение
          │          └─ источник
          └─ алиас поля выходной структуры (model/output); «объект.*» — объект целиком

   Источники:
     src('a')            колонка csv по алиасу входной структуры
     src('a', 'b')       первое непустое из нескольких колонок
     konst('2')          постоянное значение (правило системы, а не умолчание)
     opt('employee.x')   настройка конвертера, заданная пользователем
     parts([...])        несколько колонок с подписями (для поля «Иная информация»)

   Прочие правила:
     required('flDoc.number', 'текст')   поле обязано получить значение, иначе ошибка входных данных
     def('client.active', '1', 'причина') значение по умолчанию для поля без источника (mapping/defaults.js)

   Правила применяются сверху вниз; если поле уже заполнено, следующее правило для него пропускается. */
(function (C) {
  'use strict';

  const map = (target, source, transform) => ({ rule: 'map', target, source, transform });
  const required = (target, message) => ({ rule: 'required', target, message });
  const def = (target, value, reason, only) => ({ rule: 'default', target, value, reason, only });

  const src = (...aliases) => ({ kind: 'src', aliases });
  const konst = value => ({ kind: 'const', value });
  const opt = name => ({ kind: 'opt', name });
  const parts = list => ({ kind: 'parts', list });

  C.mapping.dsl = { map, required, def, src, konst, opt, parts };
})(globalThis.Comita);
