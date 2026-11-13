/* Контрольные суммы реквизитов: проверка и вычисление.
   ИНН, ОГРН, ОГРНИП, СНИЛС — по тем же правилам, что validators.ts системы-источника.
   Счёт (ключ по БИК) и ОКПО — по правилам Банка России и Росстата. */
(function (C) {
  'use strict';

  const digits = s => [...s].map(Number);
  const isDigits = (s, n) => typeof s === 'string' && /^\d+$/.test(s) && (n === undefined || s.length === n);
  const weighted = (ds, weights) => weights.reduce((sum, w, i) => sum + w * ds[i], 0);

  // ---------- ИНН ----------
  const INN10 = [2, 4, 10, 3, 5, 9, 4, 6, 8];
  const INN12A = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  const INN12B = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8];
  const innDigit = (ds, weights) => weighted(ds, weights) % 11 % 10;

  /** 9 цифр → ИНН юридического лица (10 цифр). */
  const makeInn10 = base9 => base9 + innDigit(digits(base9), INN10);
  /** 10 цифр → ИНН физического лица (12 цифр). */
  function makeInn12(base10) {
    const a = base10 + innDigit(digits(base10), INN12A);
    return a + innDigit(digits(a), INN12B);
  }
  function checkInn(v) {
    if (!isDigits(v) || /^0+$/.test(v)) return false;
    if (v.length === 10) return makeInn10(v.slice(0, 9)) === v;
    if (v.length === 12) return makeInn12(v.slice(0, 10)) === v;
    return false;
  }

  // ---------- ОГРН (13) и ОГРНИП (15) ----------
  /** 12 цифр → ОГРН, 14 цифр → ОГРНИП. */
  const makeOgrn = base => base + (Number(base) % (base.length === 12 ? 11 : 13)) % 10;
  const checkOgrn = v => isDigits(v) && (v.length === 13 || v.length === 15) && makeOgrn(v.slice(0, -1)) === v;

  // ---------- СНИЛС ----------
  function snilsControl(base9) {
    const sum = digits(base9).reduce((s, d, i) => s + d * (9 - i), 0);
    const c = sum < 100 ? sum : sum === 100 ? 0 : sum % 101 === 100 ? 0 : sum % 101;
    return String(c).padStart(2, '0');
  }
  /** 9 цифр → СНИЛС из 11 цифр (без разделителей). */
  const makeSnils = base9 => base9 + snilsControl(base9);
  /** Принимает 11 цифр или маску «ЦЦЦ-ЦЦЦ-ЦЦЦ ЦЦ». */
  function checkSnils(v) {
    const d = String(v).replace(/[-\s]/g, '');
    return isDigits(d, 11) && !/^0+$/.test(d) && makeSnils(d.slice(0, 9)) === d;
  }
  const formatSnils = d => `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)} ${d.slice(9)}`;

  // ---------- банковский счёт: ключ в 9-м разряде ----------
  const ACCOUNT_WEIGHTS = Array.from({ length: 23 }, (_, i) => [7, 1, 3][i % 3]);
  const accountSum = (prefix3, account) => digits(prefix3 + account).reduce((s, d, i) => s + (d * ACCOUNT_WEIGHTS[i]) % 10, 0) % 10;
  /** Трёхзначный префикс для расчёта ключа: расчётный счёт — последние 3 цифры БИК, корсчёт — «0» + 5–6 цифры БИК. */
  const accountPrefix = (bik, corr) => (corr ? '0' + bik.slice(4, 6) : bik.slice(6));
  /** Подставляет верный ключ в 20-значный счёт (значение 9-го разряда на входе игнорируется). */
  function makeAccount(account20, bik, corr = false) {
    const zeroed = account20.slice(0, 8) + '0' + account20.slice(9);
    const key = (accountSum(accountPrefix(bik, corr), zeroed) * 3) % 10;
    return account20.slice(0, 8) + key + account20.slice(9);
  }
  const checkAccount = (v, bik, corr = false) => isDigits(v, 20) && isDigits(bik, 9) && accountSum(accountPrefix(bik, corr), v) === 0;

  // ---------- ОКПО (8 или 10 цифр) ----------
  function okpoControl(base) {
    const ds = digits(base);
    let r = ds.reduce((s, d, i) => s + d * (i % 10 + 1), 0) % 11;
    if (r === 10) r = ds.reduce((s, d, i) => s + d * ((i + 2) % 10 + 1), 0) % 11;
    return r === 10 ? 0 : r;
  }
  /** 7 или 9 цифр → ОКПО. */
  const makeOkpo = base => base + okpoControl(base);
  const checkOkpo = v => isDigits(v) && (v.length === 8 || v.length === 10) && makeOkpo(v.slice(0, -1)) === v;

  C.core.checksums = {
    isDigits,
    makeInn10, makeInn12, checkInn,
    makeOgrn, checkOgrn,
    makeSnils, checkSnils, formatSnils,
    makeAccount, checkAccount,
    makeOkpo, checkOkpo,
  };
})(globalThis.Comita);
