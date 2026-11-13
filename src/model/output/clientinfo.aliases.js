/* Выходная структура «Карточка клиента»: алиасы объектов и полей.
   Сама структура (порядок, кратность, типы) берётся из XSD; здесь только короткие имена для маппинга.
   «@алиас/…» — путь относительно объекта. Все пути сверяются со схемой при запуске (resolve). */
(function (C) {
  'use strict';

  const objects = {
    client:   'СведКлиент/ИнфКлиент',
    org:      '@client/СведОрг',
    ul:       '@org/СведенияЮЛ',
    fl:       '@org/СведенияФЛИП',
    flName:   '@fl/ФИОФЛИП',
    flBirth:  '@fl/МестоРожд',
    flDoc:    '@fl/СведДокУдЛичн',
    addrReg:  '@client/АдрРег',
    addrPrb:  '@client/АдрПреб',
    employee: '@client/ФИОСотрудника',
  };

  const fields = {
    // ---- ИнфКлиент ----
    'client.active':           '@client/КлиентАктив',
    'client.identDate':        '@client/ДатаИдент',
    'client.type':             '@client/ТипКлиента',
    'client.resident':         '@client/ПризнакРезидент',
    'client.counterparty':     '@client/ПризнакКонтрагент',
    'client.phone':            '@client/Телефон',
    'client.identFlag':        '@client/ПризнакИдентКлиента',
    'client.relStartDate':     '@client/ДатаНачалоОтн',
    'client.fillDate':         '@client/ДатаЗаполнения',
    'client.other':            '@client/ИнаяИнф',
    'client.riskInfo':         '@client/ИнфСтепеньРиск',
    'client.passportValid':    '@client/ПаспортВалид',
    'client.relPurpose':       '@client/ИнфЦельОтношения',
    'client.relNature':        '@client/ИнфХарактерОтношения',
    'client.businessPurpose':  '@client/ИнфЦельФХД',
    'client.reputation':       '@client/ИнфРепутация',
    'client.finances':         '@client/ИнфФинансы',
    'client.fundsOrigin':      '@client/ИнфПроисхождениеДеньги',
    'client.employeePosition': '@client/ДолжностьСотрудника',
    'client.riskLevel':        '@client/СтепеньРиска',
    'employee.last':           '@employee/Фам',
    'employee.first':          '@employee/Имя',
    'employee.middle':         '@employee/Отч',
    // ---- адреса: отдельные поля; объект целиком заполняется через «addrReg.*» ----
    'addrReg.region':          '@addrReg/КодСубъектаПоОКАТО',
    'addrPrb.region':          '@addrPrb/КодСубъектаПоОКАТО',
    // ---- СведенияЮЛ ----
    'ul.fullName':             '@ul/ПолнНаимЮЛ',
    'ul.shortName':            '@ul/КратНаимЮЛ',
    'ul.okopf':                '@ul/ОКОПФЮЛ',
    'ul.inn':                  '@ul/ИННЮЛ',
    'ul.kpp':                  '@ul/КППЮЛ',
    'ul.okpo':                 '@ul/ОКПОЮЛ',
    'ul.ogrn':                 '@ul/ОГРН',
    'ul.regAuthority':         '@ul/НаименРегОрганаЮл',
    'ul.regDate':              '@ul/ДатаРегЮл',
    'ul.okved2':               '@ul/ОКВЭД2ЮЛ',
    'ul.bik':                  '@ul/БИК',
    // ---- СведенияФЛИП ----
    'flName.last':             '@flName/Фам',
    'flName.first':            '@flName/Имя',
    'flName.middle':           '@flName/Отч',
    'fl.inn':                  '@fl/ИННФЛИП',
    'fl.regAuthority':         '@fl/НаименРегОргана',
    'fl.ogrnip':               '@fl/ОГРНИП',
    'fl.regDate':              '@fl/ДатаРегИП',
    'fl.oksm':                 '@fl/КодОКСМ',
    'fl.country':              '@fl/СтранаНаименование',
    'fl.birthDate':            '@fl/ДатаРождения',
    'flBirth.city':            '@flBirth/Пункт',
    'fl.citizenshipKind':      '@fl/ВидГражданства',
    'flDoc.kind':              '@flDoc/ВидДокКод',
    'flDoc.kindName':          '@flDoc/ВидДокНаименование',
    'flDoc.series':            '@flDoc/СерияДок',
    'flDoc.number':            '@flDoc/НомДок',
    'flDoc.issueDate':         '@flDoc/ДатВыдачиДок',
    'flDoc.issuer':            '@flDoc/КемВыданДок',
    'flDoc.deptCode':          '@flDoc/КодПодр',
    'fl.pepFlag':              '@fl/ПризнакПринПубЛицо',
    'fl.kinship':              '@fl/Родство',
    'fl.identKind':            '@fl/ВидИдентификации',
    'fl.snils':                '@fl/СНИЛСФЛИП',
    'fl.okved2':               '@fl/ОКВЭД2ИП',
  };

  const expand = p => p.replace(/^@([^/]+)/, (m, a) => {
    if (!(a in objects)) throw new Error(`Выходная структура: неизвестный объект «${a}»`);
    return expand(objects[a]);
  });

  /**
   * Сверяет алиасы со схемой и возвращает функцию «алиас → путь в XML».
   * Алиас вида «объект.*» означает объект целиком и возвращает путь объекта.
   */
  function resolve(model) {
    const paths = new Map();
    for (const [alias, p] of Object.entries(objects)) paths.set(`${alias}.*`, expand(p));
    for (const [alias, p] of Object.entries(fields)) paths.set(alias, expand(p));
    for (const [alias, p] of paths) {
      if (!model.find(p)) throw new Error(`Выходная структура: алиас «${alias}» указывает на путь «${p}», которого нет в XSD`);
    }
    return alias => {
      if (!paths.has(alias)) throw new Error(`Выходная структура: неизвестный алиас «${alias}»`);
      return paths.get(alias);
    };
  }

  C.model.output.clientinfo = { objects, fields, resolve };
})(globalThis.Comita);
