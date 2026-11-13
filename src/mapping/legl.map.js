/* Маппинг: юридическое лицо (LEGL) → СведКлиент/ИнфКлиент со СведенияЮЛ. */
(function (C) {
  'use strict';
  const { map, src, konst, parts } = C.mapping.dsl;
  const t = C.mapping.transforms;
  const S = C.mapping.shared;

  C.mapping.LEGL = [
  //    поле (выход)                 источник (вход)                    преобразование
    map('client.type',              konst('1')                                          ),
    ...S.CLIENT,
    map('client.phone',             src('main.phone')                                   ),
    map('ul.fullName',              src('main.fullName')                                ),
    map('ul.shortName',             src('main.shortName')                               ),
    map('ul.okopf',                 src('main.opf'),                   t.okopf          ),
    map('ul.inn',                   src('req.inn'),                    t.inn(10)        ),
    map('ul.kpp',                   src('req.kpp'),                    t.kpp            ),
    map('ul.okpo',                  src('req.okpo'),                   t.okpo(8)        ),
    map('ul.ogrn',                  src('req.ogrn'),                   t.ogrn(13)       ),
    map('ul.regAuthority',          src('req.regAuthority')                             ),
    map('ul.regDate',               src('req.regDate'),                t.date           ),
    map('ul.okved2',                src('req.okved'),                  t.okved          ),
    map('ul.bik',                   src('req.bik'),                    t.bik            ),
    map('addrReg.*',                src('req.addrLegal'),              t.address        ),
    map('addrPrb.*',                src('req.addrPost'),               t.address        ),
    map('addrReg.region',           src('req.okato', 'req.okatoReport'), t.okatoRegion  ),  // если регион не найден в адресе
    map('client.other',             parts([
      ['Email',                     'main.email'],
      ['Сайт',                      'main.site'],
      ['Место гос. регистрации',    'req.regPlace'],
      ['ЕИО, должность',            'ceo.position'],
      ['ЕИО, ФИО',                  ['ceo.lastName', 'ceo.firstName', 'ceo.middleName']],
      ['ЕИО, дата рождения',        'ceo.birthDate'],
      ['ЕИО, ИНН',                  'ceo.inn'],
      ['ЕИО, паспорт',              ['ceo.docSeries', 'ceo.docNumber']],
      ['ЕИО, адрес',                'ceo.addrReg'],
      ['ЕИО, телефон',              'ceo.phone'],
      ['ЕИО, email',                'ceo.email'],
      ['ЕИО, статус ПДЛ',           'ceo.pep'],
      ...S.BENEFICIARY_INFO,
      ...S.BANK_INFO,
      ...S.INVESTOR_INFO,
      ...S.AGENT_INFO,
    ]),                                                                t.otherInfo      ),
  ];
})(globalThis.Comita);
