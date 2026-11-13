/* Значения по умолчанию для полей, у которых нет источника в csv.
   Применяются после правил маппинга и только к полям, оставшимся пустыми.
   В XML рядом с таким элементом ставится комментарий «значение по умолчанию: <причина>».
   Четвёртый аргумент ограничивает правило типами клиентов. */
(function (C) {
  'use strict';
  const { def } = C.mapping.dsl;
  const PERSON = ['PRSN', 'BUSN'];
  const BUSINESS = ['BUSN', 'LEGL'];
  const NOT_PROVIDED = 'Сведения не предоставлены';

  C.mapping.defaults = [
  //    поле                       значение       причина
    def('client.active',          '1',           'пользователь зарегистрирован в системе'),
    def('client.counterparty',    '0',           'в csv нет источника'),
    def('client.identFlag',       '1',           'заполнена дата идентификации пользователя'),
    def('client.passportValid',   '1',           'в csv нет источника',                        PERSON),
    def('client.riskLevel',       '1',           'в csv нет источника, принята стандартная'),
    def('fl.identKind',           '2',           'в csv нет источника, принята стандартная',   PERSON),
    def('client.riskInfo',        NOT_PROVIDED,  'в csv нет источника'),
    def('client.relPurpose',      NOT_PROVIDED,  'в csv нет источника'),
    def('client.relNature',       NOT_PROVIDED,  'в csv нет источника'),
    def('client.businessPurpose', NOT_PROVIDED,  'в csv нет источника',                        BUSINESS),
    def('client.reputation',      NOT_PROVIDED,  'в csv нет источника'),
    def('client.finances',        NOT_PROVIDED,  'в csv нет источника'),
    def('client.fundsOrigin',     NOT_PROVIDED,  'в csv нет источника'),
  ];
})(globalThis.Comita);
