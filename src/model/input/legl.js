/* Входная структура: юридическое лицо (legal_registered_users_profile_info.csv). */
(function (C) {
  'use strict';
  const { section, col, define } = C.model.input.dsl;
  const S = C.model.input.sections;

  C.model.input.LEGL = define('LEGL', 'Юридическое лицо', [
    section('main', '->Основные сведения'),
      col('userType',     'Тип пользователя'),
      col('userId',       'Идентификатор пользователя'),
      col('regDate',      'Дата регистрации в системе'),
      col('fullName',     'Полное наименование организации'),
      col('shortName',    'Краткое наименование организации'),
      col('opf',          'ОПФ'),
      col('phone',        'Телефон'),
      col('email',        'Электронная почта'),
      col('site',         'Сайт'),
    section('req', '->Реквизиты организации'),
      col('ogrn',         'ОГРН'),
      col('inn',          'ИНН'),
      col('kpp',          'КПП'),
      col('okpo',         'ОКПО'),
      col('okato',        'ОКАТО'),
      col('okatoReport',  'Код ОКАТО для отчётности'),
      col('bik',          'БИК'),
      col('okved',        'ОКВЭД'),
      col('regDate',      'Дата регистрации организации'),
      col('regAuthority', 'Наименование регистрирующего орг'),
      col('regPlace',     'Место государственной регистраци'),
      col('addrLegal',    'Адрес юридического лица'),
      col('addrPost',     'Почтовый адрес'),
    section('ceo', '->Сведения о Единоличном исполните'),
      col('position',     'Должность'),
      col('confirmDoc',   'Подтверждающий документ'),
      col('lastName',     'Фамилия'),
      col('firstName',    'Имя'),
      col('middleName',   'Отчество'),
      col('birthDate',    'Дата рождения'),
      col('birthPlace',   'Место рождения'),
      col('citizenship',  'Гражданство'),
      col('addrReg',      'Место жительства адрес регистраци'),
      col('docType',      'Документ'),
      col('docSeries',    'Серия'),
      col('docNumber',    'Номер'),
      col('docIssueDate', 'Дата выдачи'),
      col('docDeptCode',  'Дата Код подразделения'),
      col('docIssuer',    'Кем выдан'),
      col('inn',          'ИНН'),
      col('phone',        'Телефон'),
      col('email',        'Электронная почта'),
      col('pep',          'Сведения о публичном должностном '),
      col('pepKin',       'Указание кем приходится должностн'),
    ...S.TAIL,
  ]);

  /** Все входные структуры по типу пользователя. */
  C.model.input.byType = { PRSN: C.model.input.PRSN, BUSN: C.model.input.BUSN, LEGL: C.model.input.LEGL };
})(globalThis.Comita);
