import { _timeOf } from './intrinsics';

/** Whether a value is a real, valid Date, from any realm; see `_timeOf`. */
export function isValidDateInner(d: unknown) {
  const time = _timeOf(d);
  return time !== undefined && !Number.isNaN(time);
}
