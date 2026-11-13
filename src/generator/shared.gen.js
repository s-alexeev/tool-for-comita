/* Части описания генерации, общие для нескольких типов клиентов. */
(function (C) {
  'use strict';
  const { put, personColumns } = C.generator.dsl;

  /** Секция «Основные сведения» физического лица (PRSN и BUSN). */
  const PERSON_MAIN = [
  //    колонка csv               значение клиента
    put('main.userType',         'type'),
    put('main.userId',           'id'),
    put('main.regDate',          'reg.regDate'),
    put('main.fullName',         'person.fullName'),
    ...personColumns('main',     'person'),
    put('main.addrLive',         'person.addrLive'),
    put('main.addrPost',         'person.addrPost'),
    put('main.snils',            'person.snils'),
    put('main.pep',              'pep.status'),
    put('main.pepKin',           'pep.kin'),
  ];

  /** Секции после основных сведений: одинаковы для всех типов. */
  const TAIL = [
    put('ben.kind',              'ben.kind'),
    put('ben.owns25',            'ben.owns25'),
    put('ben.controls',          'ben.controls'),
    put('ben.status',            'ben.status'),
    put('ben.confirmDoc',        'ben.confirmDoc'),
    ...personColumns('ben',      'ben.person'),
    put('ben.phone',             'ben.person.phone'),
    put('ben.email',             'ben.person.email'),

    put('bank.account',          'bank.account'),
    put('bank.name',             'bank.name'),
    put('bank.bik',              'bank.bik'),
    put('bank.inn',              'bank.inn'),
    put('bank.kpp',              'bank.kpp'),
    put('bank.corrAccount',      'bank.corrAccount'),

    put('reg.applyDate',         'reg.applyDate'),
    put('reg.identDate',         'reg.identDate'),
    put('reg.regDate',           'reg.regDate'),

    put('qual.status',           'qual.status'),

    put('agent.userType',        'agent.userType'),
    put('agent.agentId',         'agent.agentId'),
    put('agent.regDate',         'agent.regDate'),
    put('agent.fullName',        'agent.person.fullName'),
    ...personColumns('agent',    'agent.person'),
    put('agent.addrLive',        'agent.person.addrLive'),
    put('agent.addrPost',        'agent.person.addrPost'),
    put('agent.snils',           'agent.person.snils'),

    put('auth.docName',          'agent.authority.docName'),
    put('auth.docNumber',        'agent.authority.docNumber'),
    put('auth.issueDate',        'agent.authority.issueDate'),
    put('auth.validTo',          'agent.authority.validTo'),
  ];

  C.generator.shared = { PERSON_MAIN, TAIL };
})(globalThis.Comita);
