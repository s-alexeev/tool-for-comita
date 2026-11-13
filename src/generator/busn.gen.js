/* Генерация: индивидуальный предприниматель (BUSN). */
(function (C) {
  'use strict';
  const { put } = C.generator.dsl;
  const S = C.generator.shared;

  C.generator.BUSN = [
    ...S.PERSON_MAIN,
  //    колонка csv               значение клиента
    put('ip.ogrnip',             'ip.ogrnip'),
    put('ip.regDate',            'ip.regDate'),
    put('ip.regAuthority',       'ip.regAuthority'),
    put('ip.regPlace',           'ip.regPlace'),
    put('ip.site',               'ip.site'),
    put('ip.okved',              'ip.okved'),
    ...S.TAIL,
  ];
})(globalThis.Comita);
