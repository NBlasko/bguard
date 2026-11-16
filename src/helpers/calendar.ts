import { BuildSchemaError } from '../exceptions';

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Whether the day exists in that month of that year, by the proleptic Gregorian calendar RFC 3339 uses.
 *
 * A regex can bound a day to 01–31 but cannot know that April has 30 days or that 2021 has no
 * February 29th, which is how `2021-02-29` used to pass. The month is expected to be 1–12 already.
 */
export function _isCalendarDay(year: number, month: number, day: number): boolean {
  const last =
    month === 2 ? (isLeapYear(year) ? 29 : 28) : month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
  return day >= 1 && day <= last;
}

/**
 * The regex source for a fractional-seconds part. With no precision the fraction is optional and of any
 * length; with a precision it is required and has exactly that many digits, and a precision of 0 forbids
 * it. Before, 0 produced `\.\d{0}`, which accepted a bare dot such as `12:00:00.`.
 *
 * A precision is spliced into a regex, so anything but a non-negative integer is refused when the schema
 * is built: `-1` or `1.5` turned `\d{…}` into a literal and the assertion matched the text `{-1}`.
 */
export function _fractionPattern(precision: number | undefined): string {
  if (precision === undefined) return '(?:\\.\\d+)?';
  if (!Number.isInteger(precision) || precision < 0) {
    throw new BuildSchemaError(`precision must be a non-negative integer, received ${String(precision)}`);
  }
  return precision === 0 ? '' : `\\.\\d{${precision}}`;
}
