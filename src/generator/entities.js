/* Сущности генератора: человек, адрес, паспорт, организация, банк и клиент целиком.
   Каждая функция (rnd, …) → объект со значениями в том виде, в каком их выгружает система
   (даты ДД.ММ.ГГГГ, реквизиты строками цифр). Значения согласованы между собой:
   регион адреса ↔ серия паспорта, код подразделения, ИНН; возраст ↔ дата выдачи паспорта;
   даты заявки ≤ идентификации ≤ регистрации. Контрольные суммы реквизитов верны. */
(function (C) {
  'use strict';
  const D = C.generator.data;
  const sums = C.core.checksums;
  const okatoOf = C.model.dict.regions.codeByName;

  const pad = (n, len = 2) => String(n).padStart(len, '0');
  const fmt = d => `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
  const addYears = (d, n) => new Date(Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate()));
  const yy = d => pad(d.getUTCFullYear() % 100);
  const uuid = rnd => [8, 4, 4, 4, 12].map(n => rnd.hex(n)).join('-');
  const phone = rnd => '9' + rnd.digits(9);

  /** Адрес в формате системы: 9 частей через запятую, пустые части остаются пустыми. */
  function address(rnd, region = rnd.pick(D.regions)) {
    const rural = region.districts && rnd.chance(0.2);
    const a = {
      region,
      zip: region.zip + rnd.digits(3),
      regionName: region.name,
      district: rural ? rnd.pick(region.districts) : '',
      city: rural ? `село ${rnd.pick(['Ивановское', 'Покровское', 'Никольское', 'Троицкое'])}` : rnd.pick(region.cities),
      street: rnd.pick(D.streets),
      house: String(rnd.int(1, 150)) + (rnd.chance(0.1) ? rnd.pick(['А', 'Б', '/2']) : ''),
      building: rnd.chance(0.1) ? String(rnd.int(1, 5)) : '',
      block: rnd.chance(0.15) ? String(rnd.int(1, 9)) : '',
      flat: rnd.chance(0.85) ? String(rnd.int(1, 300)) : '',
    };
    a.text = [a.zip, a.regionName, a.district, a.city, a.street, a.house, a.building, a.block, a.flat].join(', ');
    return a;
  }

  /** Паспорт РФ: серия = код региона по ОКАТО + год бланка; выдан в 14, 20 или 45 лет. */
  function passport(rnd, birth, region, today) {
    const issued = [45, 20, 14].map(age => addDays(addYears(birth, age), rnd.int(5, 60))).find(d => d <= today)
      || addDays(addYears(birth, 14), 5);
    return {
      docType: C.model.dict.passport.sourceValue,
      docSeries: okatoOf(region.name) + yy(issued),
      docNumber: pad(rnd.int(1, 999999), 6),
      docIssueDate: fmt(issued),
      docDeptCode: `${region.tax}0-${pad(rnd.int(1, 99), 3)}`,
      docIssuer: `ГУ МВД России по ${region.where}`,
    };
  }

  /** Физическое лицо: совершеннолетний гражданин РФ с паспортом, ИНН и СНИЛС. */
  function person(rnd, { today }, minAge = 19) {
    const names = rnd.chance(0.5) ? D.male : D.female;
    const birth = addDays(addYears(today, -rnd.int(minAge, 75)), -rnd.int(0, 364));
    const home = address(rnd);
    const region = home.region;
    const p = {
      lastName: rnd.pick(names.last), firstName: rnd.pick(names.first), middleName: rnd.pick(names.middle),
      birthDate: fmt(birth),
      birthPlace: rnd.pick(rnd.pick(D.regions).cities),
      citizenship: 'RU',
      addrReg: home.text,
      addrLive: rnd.chance(0.8) ? home.text : address(rnd, region).text,
      ...passport(rnd, birth, region, today),
      inn: sums.makeInn12(region.tax + pad(rnd.int(1, 50)) + rnd.digits(6)),
      snils: sums.makeSnils(pad(rnd.int(2, 999), 3) + rnd.digits(6)),
      phone: phone(rnd),
      email: `${rnd.pick(D.logins)}${rnd.int(1, 999)}@example.com`,
      region, birth,
    };
    p.fullName = `${p.lastName} ${p.firstName} ${p.middleName}`;
    p.addrPost = p.addrLive;
    return p;
  }

  /** Расчётный счёт клиента в одном из банков. */
  function bank(rnd, type) {
    const b = rnd.pick(D.banks);
    return { ...b, account: sums.makeAccount(D.accountPrefix[type] + '0' + rnd.digits(11), b.bik) };
  }

  /** Наименование налогового органа региона. */
  const taxOffice = (rnd, region) => `Межрайонная инспекция Федеральной налоговой службы № ${rnd.int(1, 30)} по ${region.where}`;

  /** Сведения об индивидуальном предпринимателе (дополнение к person): регистрация ИП — после 18 лет. */
  function entrepreneur(rnd, who, { today }) {
    const adult = addYears(who.birth, 18), earliest = addYears(today, -15);
    const registered = rnd.date(adult > earliest ? adult : earliest, addDays(today, -400));
    return {
      ogrnip: sums.makeOgrn('3' + yy(registered) + who.region.tax + rnd.digits(9)),
      regDate: fmt(registered),
      regAuthority: taxOffice(rnd, who.region),
      regPlace: who.addrReg,
      site: '',
      okved: rnd.pick(D.okved),
      registered,
    };
  }

  /** Юридическое лицо с реквизитами и единоличным исполнительным органом. */
  function organization(rnd, { today }) {
    const i = rnd.int(0, D.orgNames.first.length - 1);
    const name = `${D.orgNames.first[i]} ${rnd.pick(D.orgNames.second)}`;
    const opf = rnd.pick(D.opf);
    const office = address(rnd);
    const region = office.region;
    const registered = rnd.date(addYears(today, -20), addDays(today, -400));
    const inspection = pad(rnd.int(1, 50));
    const domain = `${D.orgNames.slug[i]}-${rnd.int(10, 99)}.example.com`;
    const okato = okatoOf(region.name) + rnd.digits(6) + '000';
    return {
      fullName: `${opf.full} "${name}"`, shortName: `${opf.short} "${name}"`, opf: opf.full,
      phone: phone(rnd), email: `${rnd.pick(D.logins)}@${domain}`, site: `https://${domain}`,
      ogrn: sums.makeOgrn('1' + yy(registered) + region.tax + rnd.digits(7)),
      inn: sums.makeInn10(region.tax + inspection + rnd.digits(5)),
      kpp: region.tax + inspection + '01001',
      okpo: sums.makeOkpo(rnd.digits(7)),
      okato, okatoReport: okato,
      bik: '',                                  // БИК есть только у кредитных организаций
      okved: rnd.pick(D.okved),
      regDate: fmt(registered),
      regAuthority: taxOffice(rnd, region),
      regPlace: office.text, addrLegal: office.text,
      addrPost: rnd.chance(0.8) ? office.text : address(rnd, region).text,
      ceo: { ...person(rnd, { today }), position: rnd.pick(D.positions), confirmDoc: 'Устав', pep: D.pep.none, pepKin: '' },
      registered,
    };
  }

  /** Статус ПДЛ: у большинства «не являюсь»; у родственника заполнена степень родства. */
  function pep(rnd) {
    const roll = rnd.next();
    if (roll < 0.9) return { status: D.pep.none, kin: '' };
    if (roll < 0.95) return { status: D.pep.self, kin: '' };
    return { status: D.pep.relative, kin: rnd.pick(D.pep.kin) };
  }

  /** Бенефициар: ФЛ и ИП — сами себе; у ЮЛ в части случаев отдельное физическое лицо. */
  function beneficiary(rnd, type, ctx) {
    if (type !== 'LEGL' || rnd.chance(0.4)) return { kind: D.beneficiary.self, owns25: 'Нет', controls: 'Нет', person: {} };
    return {
      kind: D.beneficiary.other, owns25: rnd.pick(['Да', 'Нет']), controls: rnd.pick(['Да', 'Нет']),
      status: rnd.pick(D.beneficiary.statuses), confirmDoc: rnd.pick(D.beneficiary.documents),
      person: person(rnd, ctx),
    };
  }

  /** Представитель: у ЮЛ есть всегда, у ФЛ и ИП — изредка. Без представителя — «NOAGENT». */
  function agent(rnd, type, reg, ctx) {
    if (type !== 'LEGL' && rnd.chance(0.85)) return { userType: 'NOAGENT', person: {}, authority: {} };
    const issued = addDays(reg.applied, -rnd.int(1, 300));
    return {
      userType: 'AGENT', agentId: uuid(rnd), regDate: fmt(reg.registered),
      person: person(rnd, ctx),
      authority: {
        docName: rnd.pick(D.authority), docNumber: String(rnd.int(1, 999)),
        issueDate: fmt(issued), validTo: fmt(addYears(issued, rnd.int(1, 3))),
      },
    };
  }

  /**
   * Клиент целиком — всё, что попадает в одну строку csv.
   * @param type  PRSN | BUSN | LEGL
   * @param ctx   { today: Date } — дата, относительно которой считаются возраст и сроки
   */
  function client(rnd, type, ctx) {
    const applied = rnd.date(addDays(ctx.today, -365), addDays(ctx.today, -5));
    const identified = addDays(applied, rnd.int(0, 3));
    const registered = addDays(identified, rnd.int(0, 2));
    const reg = { applied, registered, applyDate: fmt(applied), identDate: fmt(identified), regDate: fmt(registered) };
    const c = {
      type, id: uuid(rnd), reg,
      bank: bank(rnd, type),
      qual: { status: rnd.pick(D.investor) },
    };
    if (type === 'LEGL') c.org = organization(rnd, ctx);
    else {
      c.person = person(rnd, ctx, type === 'BUSN' ? 21 : 19);
      c.pep = pep(rnd);
      if (type === 'BUSN') { c.ip = entrepreneur(rnd, c.person, ctx); c.person.fullName = `ИП ${c.person.fullName}`; }
    }
    c.ben = beneficiary(rnd, type, ctx);
    c.agent = agent(rnd, type, reg, ctx);
    return c;
  }

  C.generator.entities = { address, passport, person, bank, entrepreneur, organization, pep, beneficiary, agent, client };
})(globalThis.Comita);
