/* Входная структура: физическое лицо (prsn_registered_users_profile_info.csv). */
(function (C) {
  'use strict';
  const { define } = C.model.input.dsl;
  const S = C.model.input.sections;

  C.model.input.PRSN = define('PRSN', 'Физическое лицо', [
    ...S.PERSON_MAIN,
    ...S.PEP,
    ...S.TAIL,
  ]);
})(globalThis.Comita);
