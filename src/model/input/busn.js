/* Входная структура: индивидуальный предприниматель (busn_registered_users_profile_info.csv). */
(function (C) {
  'use strict';
  const { section, col, define } = C.model.input.dsl;
  const S = C.model.input.sections;

  C.model.input.BUSN = define('BUSN', 'Индивидуальный предприниматель', [
    ...S.PERSON_MAIN,
    section('ip', '->Сведения об Индивидуальном предп'),
      col('ogrnip',       'ОГРНИП'),
      col('regDate',      'Дата регистрации ИП'),
      col('regAuthority', 'Наименование регистрирующего орг'),
      col('regPlace',     'Место государственной регистраци'),
      col('site',         'Сайт'),
      col('okved',        'ОКВЭД'),
    ...S.PEP,
    ...S.TAIL,
  ]);
})(globalThis.Comita);
