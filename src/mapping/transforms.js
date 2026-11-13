/* Преобразования значений для маппинга. Каждое — чистая функция (значение, ctx) → результат:
     строка            значение элемента
     массив строк      повторяющийся элемент
     объект            значения дочерних элементов (для правил «объект.*»)
     undefined         элемент не выводится
   ctx.warn(текст) добавляет предупреждение, ctx.asDefault(причина) помечает значение как умолчание. */
(function (C) {
  'use strict';
  const D = C.model.dict;
  const sums = C.core.checksums;

  const clean = v => String(v ?? '').trim();
  /** Число, испорченное пересохранением в Excel: 4,08E+19. */
  const isExcelDamaged = v => /^\d+([.,]\d+)?E\+?\d+$/i.test(clean(v));

  // ---------- даты ----------
  /** ДД.ММ.ГГГГ → ДД/ММ/ГГГГ (формат XSD). */
  function date(value, ctx) {
    const m = /^(\d{2})[./](\d{2})[./](\d{4})$/.exec(clean(value));
    if (!m) return ctx.warn(`дата «${value}» не в формате ДД.ММ.ГГГГ, не выведена`);
    const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    if (d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[1]) return ctx.warn(`дата «${value}» не существует, не выведена`);
    return `${m[1]}/${m[2]}/${m[3]}`;
  }

  // ---------- числовые реквизиты ----------
  /**
   * Реквизит фиксированной длины из цифр. Короткое значение дополняется ведущими нулями:
   * их теряет Excel при пересохранении файла. Контрольная сумма проверяется, но не блокирует вывод.
   */
  const requisite = (label, length, check) => (value, ctx) => {
    let v = clean(value).replace(/\s/g, '');
    if (isExcelDamaged(v)) return ctx.warn(`${label} «${value}» повреждён при пересохранении в Excel, не выведен`);
    if (!/^\d+$/.test(v)) return ctx.warn(`${label} «${value}» содержит не только цифры, не выведен`);
    if (v.length > length) return ctx.warn(`${label} «${value}»: ${v.length} цифр вместо ${length}, не выведен`);
    if (v.length < length) {
      ctx.warn(`${label} «${value}»: ${v.length} цифр вместо ${length}, восстановлены ведущие нули`);
      v = v.padStart(length, '0');
    }
    if (check && !check(v)) ctx.warn(`${label} «${v}»: неверная контрольная сумма`);
    return v;
  };
  const inn = length => requisite('ИНН', length, sums.checkInn);
  const ogrn = length => requisite(length === 15 ? 'ОГРНИП' : 'ОГРН', length, sums.checkOgrn);
  const kpp = requisite('КПП', 9);
  const bik = requisite('БИК', 9);
  const okpo = length => requisite('ОКПО', length, sums.checkOkpo);
  /** 11 цифр или маска → «ЦЦЦ-ЦЦЦ-ЦЦЦ ЦЦ». */
  function snils(value, ctx) {
    const d = requisite('СНИЛС', 11, sums.checkSnils)(clean(value).replace(/-/g, ''), ctx);
    return d && sums.formatSnils(d);
  }
  /** Один код или список кодов ОКВЭД через «|», «;» или «,». */
  function okved(value, ctx) {
    const codes = clean(value).split(/[|;,]/).map(clean).filter(Boolean);
    const ok = codes.filter(c => /^\d{2}(\.\d{1,2}){0,2}$/.test(c));
    if (ok.length < codes.length) ctx.warn(`ОКВЭД «${value}»: часть кодов не в формате ЦЦ.ЦЦ.ЦЦ, они не выведены`);
    return ok;
  }

  // ---------- справочники ----------
  function country(field) {
    return (value, ctx) => {
      const c = D.oksm[clean(value).toUpperCase()];
      if (!c) return ctx.warn(`гражданство «${value}» не найдено в справочнике ОКСМ`);
      return c[field] || undefined;
    };
  }
  const citizenshipKind = value => D.citizenshipKind[clean(value).toUpperCase()] || D.citizenshipKind['*'];

  /** В системе только паспорта РФ: код и наименование постоянны, колонка «Документ» лишь сверяется. */
  function passport(field) {
    return (value, ctx) => {
      if (clean(value) !== D.passport.sourceValue) ctx.warn(`вид документа «${value}» не «${D.passport.sourceValue}»: выведен код паспорта РФ`);
      return D.passport[field];
    };
  }

  function okopf(value, ctx) {
    const hit = D.okopf[clean(value).toLowerCase().replace(/ё/g, 'е')];
    if (!hit) return ctx.warn(`ОПФ «${value}» не найдена в справочнике ОКОПФ, код не выведен`);
    if (hit.warn) ctx.warn(`ОПФ «${value}»: ${hit.warn}`);
    return hit.code;
  }

  /** Статус ПДЛ → ПризнакПринПубЛицо. Государство ПДЛ в csv не выгружается, поэтому принимается «Россия». */
  function pepFlag(value, ctx) {
    const codes = D.pepStatus[clean(value)];
    if (!codes) return ctx.warn(`статус ПДЛ «${value}» не найден в справочнике, признак не выведен`);
    if (codes[0] !== '0') ctx.asDefault('государство ПДЛ в csv не выгружается, принято «Россия»');
    return codes[0];
  }

  /** Свободный текст «Степень родства» → код по ключевому слову. */
  function kinship(value, ctx) {
    const words = clean(value).toLowerCase().replace(/ё/g, 'е').split(/[^а-я]+/).filter(Boolean);
    const codes = [...new Set(words.map(w => D.kinship[w]).filter(Boolean))];
    if (codes.length === 1) return codes[0];
    return ctx.warn(`степень родства «${value}» не удалось однозначно перевести в код`);
  }

  /** Первые две цифры ОКАТО → КодСубъектаПоОКАТО. */
  const okatoRegion = value => (/^\d{2}/.exec(clean(value)) || [])[0];

  // ---------- адрес ----------
  /* Система склеивает адрес из полей формы в порядке:
       Индекс, Регион, Район, Населённый пункт, Улица, Дом, Строение, Корпус, Квартира
     Строка из 9 частей (или 8 — без Района) раскладывается обратно по позициям.
     Признаки, что строка действительно склеена так: первая часть — индекс, вторая — субъект РФ.
     Любая другая строка не разбирается: индекс (если есть) и остальной текст в «Пункт». */
  const SLOTS9 = ['zip', 'region', 'district', 'city', 'street', 'house', 'building', 'block', 'flat'];
  const SLOTS8 = SLOTS9.filter(s => s !== 'district');
  const RUSSIA = { КодОКСМ: '643', СтранаНаименование: 'Россия' };

  function address(value, ctx) {
    const text = clean(value);
    if (!text) return undefined;
    const list = text.split(',').map(clean);
    const slots = list.length === 9 ? SLOTS9 : list.length === 8 ? SLOTS8 : null;
    const regionCode = slots && /^\d{6}$/.test(list[0]) ? D.regions.codeByName(list[1]) : undefined;
    if (regionCode) {
      const a = Object.fromEntries(slots.map((s, i) => [s, list[i]]));
      if (list.length === 8) ctx.warn(`адрес «${text}» из 8 частей: считаем, что пропущен Район`);
      return {
        ...RUSSIA,
        Индекс: a.zip,
        КодСубъектаПоОКАТО: regionCode,
        Район: a.district,
        Пункт: a.city,
        Улица: a.street,
        Дом: a.house,
        Корп: [a.block, a.building && `стр. ${a.building}`].filter(Boolean).join(', '),
        Оф: a.flat,
      };
    }
    ctx.warn(`адрес «${text}» не в формате системы (9 частей, индекс, субъект РФ): записан в «Пункт» без разбора`);
    const zip = (/^(\d{6})\s*,/.exec(text) || [])[1];
    const rest = (zip ? text.slice(text.indexOf(',') + 1) : text).replace(/(\s*,)+\s*$/, '').trim();
    const found = [...new Set(list.map(D.regions.codeByName).filter(Boolean))];
    return {
      ...(found.length === 1 ? { ...RUSSIA, КодСубъектаПоОКАТО: found[0] } : {}),
      Индекс: zip,
      Пункт: rest,
    };
  }

  // ---------- «Иная информация» ----------
  /** Список { label, value } → «Подпись: значение; Подпись: значение». */
  function otherInfo(items, ctx) {
    const out = [];
    for (const { label, value } of items) {
      const v = clean(value).replace(/\s+/g, ' ');
      if (!v) continue;
      if (isExcelDamaged(v)) {
        ctx.warn(`«${label}»: значение «${v}» повреждено при пересохранении в Excel`);
        out.push(`${label}: ${v} (значение повреждено в Excel)`);
      } else out.push(`${label}: ${v}`);
    }
    return out.join('; ');
  }

  C.mapping.transforms = {
    date, inn, ogrn, kpp, bik, okpo, snils, okved,
    country, citizenshipKind, passport, okopf, pepFlag, kinship, okatoRegion,
    address, otherInfo,
  };
})(globalThis.Comita);
