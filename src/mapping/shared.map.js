/* Части маппинга, общие для нескольких типов клиентов. */
(function (C) {
  'use strict';
  const { map, required, src, konst, opt } = C.mapping.dsl;
  const t = C.mapping.transforms;

  /** Поля уровня ИнфКлиент, одинаковые для всех типов. */
  const CLIENT = [
  //    поле (выход)                 источник (вход)                    преобразование
    map('client.resident',          konst('1')                                          ),  // все пользователи системы — резиденты
    map('client.identDate',         src('reg.identDate'),              t.date           ),
    map('client.relStartDate',      src('reg.regDate'),                t.date           ),
    map('client.fillDate',          src('reg.applyDate'),              t.date           ),
    map('employee.last',            opt('employee.lastName')                            ),
    map('employee.first',           opt('employee.firstName')                           ),
    map('employee.middle',          opt('employee.middleName')                          ),
    map('client.employeePosition',  opt('employee.position')                            ),
  ];

  /** Сведения о физическом лице: общие для ФЛ (PRSN) и ИП (BUSN). */
  const PERSON = [
  //    поле (выход)                 источник (вход)                    преобразование
    map('flName.last',              src('main.lastName')                                ),
    map('flName.first',             src('main.firstName')                               ),
    map('flName.middle',            src('main.middleName')                              ),
    map('fl.inn',                   src('main.inn'),                   t.inn(12)        ),
    map('fl.snils',                 src('main.snils'),                 t.snils          ),
    map('fl.oksm',                  src('main.citizenship'),           t.country('code')),
    map('fl.country',               src('main.citizenship'),           t.country('name')),
    map('fl.citizenshipKind',       src('main.citizenship'),           t.citizenshipKind),
    map('fl.birthDate',             src('main.birthDate'),             t.date           ),
    map('flBirth.city',             src('main.birthPlace')                              ),
    map('flDoc.kind',               src('main.docType'),               t.passport('code')),
    map('flDoc.kindName',           src('main.docType'),               t.passport('name')),
    map('flDoc.series',             src('main.docSeries')                               ),
    map('flDoc.number',             src('main.docNumber')                               ),
    map('flDoc.issueDate',          src('main.docIssueDate'),          t.date           ),
    map('flDoc.issuer',             src('main.docIssuer')                               ),
    map('flDoc.deptCode',           src('main.docDeptCode')                             ),
    map('fl.pepFlag',               src('main.pep'),                   t.pepFlag        ),
    map('fl.kinship',               src('main.pepKin'),                t.kinship        ),
    map('addrReg.*',                src('main.addrReg'),               t.address        ),
    map('addrPrb.*',                src('main.addrLive'),              t.address        ),
    required('flDoc.series',        'не заполнена серия паспорта: в системе-источнике паспортные данные обязательны'),
    required('flDoc.number',        'не заполнен номер паспорта: в системе-источнике паспортные данные обязательны'),
  ];

  /* Данные, которым нет места в XSD: уходят в «Иную информацию» как «Подпись: значение». */
  const BENEFICIARY_INFO = [
    ['Бенефициар',                  'ben.kind'],
    ['Бенефициар, статус',          'ben.status'],
    ['Бенефициар, ФИО',             ['ben.lastName', 'ben.firstName', 'ben.middleName']],
    ['Бенефициар, дата рождения',   'ben.birthDate'],
    ['Бенефициар, ИНН',             'ben.inn'],
    ['Бенефициар, паспорт',         ['ben.docSeries', 'ben.docNumber']],
    ['Бенефициар, адрес',           'ben.addrReg'],
  ];
  const BANK_INFO = [
    ['Банк',                        'bank.name'],
    ['БИК',                         'bank.bik'],
    ['Расчётный счёт',              'bank.account'],
    ['Корр. счёт',                  'bank.corrAccount'],
  ];
  const INVESTOR_INFO = [
    ['Статус инвестора',            'qual.status'],
  ];
  const AGENT_INFO = [
    ['Представитель, ФИО',          ['agent.lastName', 'agent.firstName', 'agent.middleName']],
    ['Представитель, ИНН',          'agent.inn'],
    ['Представитель, СНИЛС',        'agent.snils'],
    ['Представитель, паспорт',      ['agent.docSeries', 'agent.docNumber']],
    ['Документ полномочий',         ['auth.docName', 'auth.docNumber']],
    ['Полномочия с',                'auth.issueDate'],
    ['Полномочия по',               'auth.validTo'],
  ];

  C.mapping.shared = { CLIENT, PERSON, BENEFICIARY_INFO, BANK_INFO, INVESTOR_INFO, AGENT_INFO };
})(globalThis.Comita);
