/* Маппинг: физическое лицо (PRSN) → СведКлиент/ИнфКлиент со СведенияФЛИП. */
(function (C) {
  'use strict';
  const { map, src, konst, parts } = C.mapping.dsl;
  const t = C.mapping.transforms;
  const S = C.mapping.shared;

  C.mapping.PRSN = [
  //    поле (выход)                 источник (вход)                    преобразование
    map('client.type',              konst('2')                                          ),
    ...S.CLIENT,
    ...S.PERSON,
    map('client.other',             parts([
      ['Почтовый адрес',            'main.addrPost'],
      ...S.BENEFICIARY_INFO,
      ...S.BANK_INFO,
      ...S.INVESTOR_INFO,
      ...S.AGENT_INFO,
    ]),                                                                t.otherInfo      ),
  ];
})(globalThis.Comita);
