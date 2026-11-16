import { _isCalendarDay } from '../../helpers/calendar';
import { date } from '../date/index';

// `new Date` rolls a day the month does not have into the next month: `2021-02-30` is March 2nd. This
// catches every numeric shape it reads that way: year first (`2021-02-30`, `2021/02/30`, `2021.02.30`,
// `+002021-02-30`) and month first (`02/30/2021`, `02-30-2021`, `02.30.2021`), with one- or two-digit
// parts, leading whitespace, and anything after. Month-first is how V8 reads all three separators, so a
// day-first date such as `30.01.2021` is not a date to it either. Shapes with a month name
// (`Feb 30 2021`) are not checked.
const yearFirst = /^\s*([+-]\d{6}|\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/;
const monthFirst = /^\s*(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?!\d)/;

function namesMissingDay(received: string): boolean {
  const ymd = yearFirst.exec(received);
  const mdy = ymd ? null : monthFirst.exec(received);
  const parts = ymd ? [ymd[1], ymd[2], ymd[3]] : mdy ? [mdy[3], mdy[1], mdy[2]] : null;
  if (!parts) return false;
  const [year, month, day] = parts.map(Number) as [number, number, number];
  return !_isCalendarDay(year, month, day);
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
 * An unreadable value becomes an invalid Date, which `date()` rejects. So does a numeric date naming a
 * day that does not exist, such as `2021-02-30`, `2021/02/30` or `02/30/2021`, which `new Date` would
 * roll over into March 2nd. A date written with a month name (`Feb 30 2021`) is read exactly as
 * `new Date` reads it.
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
