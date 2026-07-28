import { coerceBigInt } from './bigint';
import { coerceBoolean } from './boolean';
import { coerceDate } from './date';
import { coerceNumber } from './number';
import { coerceString } from './string';

export { coerceBigInt } from './bigint';
export { coerceBoolean } from './boolean';
export { coerceDate } from './date';
export { coerceNumber } from './number';
export { coerceString } from './string';

/**
 * The coercing schemas gathered under one name, for when reaching for several of them reads better than
 * five imports.
 *
 * Note that this object references all five, so a bundler has to keep all five wherever it is used —
 * importing it for `coerce.number()` alone still pulls in the string, boolean, bigint and date schemas.
 * Import the one you need from its own module when that matters:
 *
 * ```typescript
 * import { coerceNumber } from 'bguard/coerce/number';
 * ```
 *
 * @example
 * const querySchema = object({ page: coerce.number().default(1), q: coerce.string() });
 * parseOrFail(querySchema, { page: '3', q: 'shoes' }); // { page: 3, q: 'shoes' }
 */
export const coerce = {
  string: coerceString,
  number: coerceNumber,
  boolean: coerceBoolean,
  bigint: coerceBigInt,
  date: coerceDate,
};
