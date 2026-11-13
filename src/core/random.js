/* Генератор псевдослучайных чисел с зерном: одинаковое зерно → одинаковые данные. */
(function (C) {
  'use strict';

  function create(seed) {
    let a = (Number(seed) || 0) >>> 0;
    const next = () => {                      // mulberry32
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const int = (min, max) => min + Math.floor(next() * (max - min + 1));
    return {
      next, int,
      pick: list => list[int(0, list.length - 1)],
      chance: p => next() < p,
      /** Строка из n случайных цифр. */
      digits: n => Array.from({ length: n }, () => int(0, 9)).join(''),
      hex: n => Array.from({ length: n }, () => '0123456789abcdef'[int(0, 15)]).join(''),
      /** Случайная дата в интервале [from, to] (объекты Date, по UTC). */
      date: (from, to) => new Date(from.getTime() + Math.floor(next() * (to.getTime() - from.getTime() + 1))),
    };
  }

  C.core.random = { create };
})(globalThis.Comita);
