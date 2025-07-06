import { ctxSymbol } from './constants';
import { type CommonSchema } from './core';

export function _setStrictType(that: CommonSchema, val: unknown) {
  that[ctxSymbol].strictType = true;
  that[ctxSymbol].strictTypeValue = val;
}
