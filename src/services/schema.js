/* Схема «Карточка клиента»: модель XSD и проверка XML по ней.
   Текст схемы лежит в schemas/clientinfo.xsd.js (его генерирует build.js из CLIENTINFO_merged.xsd). */
(function (C) {
  'use strict';
  const { xml, xsdModel, xsdValidate } = C.core;

  let model = null;
  /** Модель схемы (строится один раз). */
  function getModel() {
    if (!model) {
      if (!C.schemas.clientinfo) throw new Error('Схема не загружена: нет schemas/clientinfo.xsd.js (запустите node build.js)');
      model = xsdModel.build(C.schemas.clientinfo);
    }
    return model;
  }

  /**
   * Проверка XML-текста по схеме.
   * @returns {{ ok: boolean, errors: [{ path, line, message }] }}
   */
  function validate(xmlText) {
    let root;
    try { root = xml.parse(xmlText); }
    catch (e) { return { ok: false, errors: [{ path: '', line: 0, message: e.message }] }; }
    const errors = xsdValidate.validate(root, getModel());
    return { ok: errors.length === 0, errors };
  }

  C.services.schema = { getModel, validate };
})(globalThis.Comita);
