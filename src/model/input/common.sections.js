/* Секции csv, одинаковые для всех типов пользователей. */
(function (C) {
  'use strict';
  const { section, col } = C.model.input.dsl;

  /** Основные сведения о физическом лице (PRSN и BUSN). */
  const PERSON_MAIN = [
    section('main', '->Основные сведения'),
      col('userType',     'Тип пользователя'),
      col('userId',       'Идентификатор пользователя'),
      col('regDate',      'Дата регистрации в системе'),
      col('fullName',     'ФИО'),
      col('lastName',     'Фамилия'),
      col('firstName',    'Имя'),
      col('middleName',   'Отчество'),
      col('birthDate',    'Дата рождения'),
      col('birthPlace',   'Место рождения'),
      col('citizenship',  'Гражданство'),
      col('addrReg',      'Место жительства (адрес регистрац'),
      col('addrLive',     'Адрес проживания'),
      col('addrPost',     'Почтовый адрес'),
      col('docType',      'Документ'),
      col('docSeries',    'Серия'),
      col('docNumber',    'Номер'),
      col('docIssueDate', 'Дата выдачи'),
      col('docDeptCode',  'Дата Код подразделения'),
      col('docIssuer',    'Кем выдан'),
      col('inn',          'ИНН'),
      col('snils',        'СНИЛС'),
  ];

  const PEP = [
      col('main.pep',     'Сведения о публичном должностном '),
      col('main.pepKin',  'Указание кем приходится должностн'),
  ];

  const BENEFICIARY = [
    section('ben', '->Сведения о бенефициарных владель'),
      col('kind',         'Бенефициар'),
      col('owns25',       'Признак владения 25% акций и более'),
      col('controls',     'Признак контроля действий ЮЛ'),
      col('status',       'Статус'),
      col('confirmDoc',   'Подтверждающий документ'),
      col('lastName',     'Фамилия'),
      col('firstName',    'Имя'),
      col('middleName',   'Отчество'),
      col('birthDate',    'Дата рождения'),
      col('birthPlace',   'Место рождения'),
      col('citizenship',  'Гражданство'),
      col('addrReg',      'Место жительства (адрес регистрац'),
      col('docType',      'Документ'),
      col('docSeries',    'Серия'),
      col('docNumber',    'Номер'),
      col('docIssueDate', 'Дата выдачи'),
      col('docDeptCode',  'Дата Код подразделения'),
      col('docIssuer',    'Кем выдан'),
      col('inn',          'ИНН'),
      col('phone',        'Телефон'),
      col('email',        'Электронная почта'),
  ];

  const BANK = [
    section('bank', '->Банковские реквизиты'),
      col('account',      'Номер счета (расчетный счет)'),
      col('name',         'Наименование банка'),
      col('bik',          'БИК банка'),
      col('inn',          'ИНН банка'),
      col('kpp',          'КПП банка'),
      col('corrAccount',  'Корреспондентский счёт банка'),
  ];

  const REGISTRATION = [
    section('reg', '->Регистрация пользователя'),
      col('applyDate',    'Дата подачи заявки на регистрацию'),
      col('identDate',    'Дата идентификации пользователя'),
      col('regDate',      'Дата регистрации в системе'),
  ];

  const QUALIFICATION = [
    section('qual', '->Квалификация инвестора'),
      col('status',       'Статус инвестора'),
      col('initiator',    'Инциатор заявки'),
      col('requestType',  'Тип заявки'),
      col('requestDate',  'Дата подачи заявки по изменению ст'),
      col('executeDate',  'Дата исполнения заявки по изменен'),
  ];

  const AGENT = [
    section('agent', '->Основные сведения о представител'),
      col('userType',     'Тип пользователя'),
      col('agentId',      'Идентификатор агента'),
      col('regDate',      'Дата регистрации в системе'),
      col('fullName',     'ФИО'),
      col('lastName',     'Фамилия'),
      col('firstName',    'Имя'),
      col('middleName',   'Отчество'),
      col('birthDate',    'Дата рождения'),
      col('birthPlace',   'Место рождения'),
      col('citizenship',  'Гражданство'),
      col('addrReg',      'Место жительства (адрес регистрац'),
      col('addrLive',     'Адрес проживания'),
      col('addrPost',     'Почтовый адрес'),
      col('docType',      'Документ'),
      col('docSeries',    'Серия'),
      col('docNumber',    'Номер'),
      col('docIssueDate', 'Дата выдачи'),
      col('docDeptCode',  'Дата Код подразделения'),
      col('docIssuer',    'Кем выдан'),
      col('inn',          'ИНН'),
      col('snils',        'СНИЛС'),
  ];

  const AUTHORITY = [
    section('auth', '->Документ, подтверждающий полномо'),
      col('docName',      'Наименование документа'),
      col('docNumber',    'Номер документа'),
      col('issueDate',    'Дата выдачи'),
      col('validTo',      'Срок действия'),
  ];

  /** Хвост файла, общий для всех типов. */
  const TAIL = [...BENEFICIARY, ...BANK, ...REGISTRATION, ...QUALIFICATION, ...AGENT, ...AUTHORITY];

  C.model.input.sections = { PERSON_MAIN, PEP, BENEFICIARY, BANK, REGISTRATION, QUALIFICATION, AGENT, AUTHORITY, TAIL };
})(globalThis.Comita);
