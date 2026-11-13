/* Генерация: юридическое лицо (LEGL). */
(function (C) {
  'use strict';
  const { put, personColumns } = C.generator.dsl;
  const S = C.generator.shared;

  C.generator.LEGL = [
  //    колонка csv               значение клиента
    put('main.userType',         'type'),
    put('main.userId',           'id'),
    put('main.regDate',          'reg.regDate'),
    put('main.fullName',         'org.fullName'),
    put('main.shortName',        'org.shortName'),
    put('main.opf',              'org.opf'),
    put('main.phone',            'org.phone'),
    put('main.email',            'org.email'),
    put('main.site',             'org.site'),

    put('req.ogrn',              'org.ogrn'),
    put('req.inn',               'org.inn'),
    put('req.kpp',               'org.kpp'),
    put('req.okpo',              'org.okpo'),
    put('req.okato',             'org.okato'),
    put('req.okatoReport',       'org.okatoReport'),
    put('req.bik',               'org.bik'),
    put('req.okved',             'org.okved'),
    put('req.regDate',           'org.regDate'),
    put('req.regAuthority',      'org.regAuthority'),
    put('req.regPlace',          'org.regPlace'),
    put('req.addrLegal',         'org.addrLegal'),
    put('req.addrPost',          'org.addrPost'),

    put('ceo.position',          'org.ceo.position'),
    put('ceo.confirmDoc',        'org.ceo.confirmDoc'),
    ...personColumns('ceo',      'org.ceo'),
    put('ceo.phone',             'org.ceo.phone'),
    put('ceo.email',             'org.ceo.email'),
    put('ceo.pep',               'org.ceo.pep'),
    put('ceo.pepKin',            'org.ceo.pepKin'),
    ...S.TAIL,
  ];
})(globalThis.Comita);
