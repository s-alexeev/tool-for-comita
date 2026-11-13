/* Маппинг: индивидуальный предприниматель (BUSN) → СведКлиент/ИнфКлиент со СведенияФЛИП. */
(function (C) {
  'use strict';
  const { map, src, konst, parts } = C.mapping.dsl;
  const t = C.mapping.transforms;
  const S = C.mapping.shared;

  C.mapping.BUSN = [
  //    поле (выход)                 источник (вход)                    преобразование
    map('client.type',              konst('3')                                          ),
    ...S.CLIENT,
    ...S.PERSON,
    map('fl.ogrnip',                src('ip.ogrnip'),                  t.ogrn(15)       ),
    map('fl.regDate',               src('ip.regDate'),                 t.date           ),
    map('fl.regAuthority',          src('ip.regAuthority')                              ),
    map('fl.okved2',                src('ip.okved'),                   t.okved          ),
    map('client.other',             parts([
      ['Сайт',                      'ip.site'],
      ['Почтовый адрес',            'main.addrPost'],
      ['Место гос. регистрации ИП', 'ip.regPlace'],
      ...S.BENEFICIARY_INFO,
      ...S.BANK_INFO,
      ...S.INVESTOR_INFO,
      ...S.AGENT_INFO,
    ]),                                                                t.otherInfo      ),
  ];
})(globalThis.Comita);
