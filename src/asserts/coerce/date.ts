import { _isCalendarDay } from '../../helpers/calendar';
import { date } from '../date/index';

// `new Date` rolls a day the month does not have into the next month: `2021-02-30` is March 2nd. These
// are the two shapes it does that for with a year, month and day that can be read off the string: ISO
// `YYYY-MM-DD` (also with one-digit parts, and with a time after it), and the US `MM/DD/YYYY`.
const isoDay = /^(\d{4})-(\d{1,2})-(\d{1,2})(?!\d)/;
const usDay = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?!\d)/;

function namesMissingDay(received: string): boolean {
  const iso = isoDay.exec(received);
  const us = iso ? null : usDay.exec(received);
  const parts = iso ? [iso[1], iso[2], iso[3]] : us ? [us[3], us[1], us[2]] : null;
  if (!parts) return false;
  const [year, month, day] = parts.map(Number) as [number, number, number];
  return month < 1 || month > 12 || !_isCalendarDay(year, month, day);
}

/**
 * A coercing transform must never throw: it runs before validation, and throwing would replace a clear
 * validation error with an unexplained failure. Anything it cannot convert is passed through unchanged
 * so that validation reports the type problem itself.
 *
 * `null` is never coerced, so `nullable()` still decides whether it is allowed rather than it becoming
 * the string `'null'` or the number `0`.
 *
 * The return type is inferred rather than written out. Naming it flattened the schema to
 * `CommonSchema`, which silently dropped the methods only the concrete classes define — `equalTo`,
 * `oneOfValues`, `onlyTrue`, `onlyFalse`.
 */
/**
 * @description Coerces the received value to a Date before validating it. Anything that is not already
 * a Date is passed through `new Date`.
 *
 * An unreadable value becomes an invalid Date, which `date()` rejects. So does a string naming a day
 * that does not exist, such as `2021-02-30` or `02/30/2021`, which `new Date` would roll over into
 * March 2nd. Other string formats are read exactly as `new Date` reads them.
 *
 * @returns A date schema that accepts `unknown` as its input type.
 * @example
 * parseOrFail(coerceDate(), '2024-01-01'); // Date
 */
export const coerceDate = () =>
  date().transformBeforeValidation<unknown>((received) => {
    if (received === null || received instanceof Date) return received as Date;
    if (typeof received === 'string' && namesMissingDay(received)) return new Date(NaN);
    return new Date(received as string);
  });
