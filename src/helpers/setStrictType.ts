import { ctxSymbol } from './core';
import type { CommonSchema } from '../schemas/CommonSchema';

export function _setStrictType(that: CommonSchema, val: unknown) {
  that[ctxSymbol].strictType = true;
  that[ctxSymbol].strictTypeValue = val;
}
