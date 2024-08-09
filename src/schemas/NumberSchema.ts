import { equalTo } from '../asserts/common/equalTo';

import { CommonSchema } from './CommonSchema';

export class NumberSchema extends CommonSchema {
  _number = 1;
  equalTo<Y extends number>(expectedValue: Y): WithNumber<this, Y> {
    return this.custom(equalTo(expectedValue)) as WithNumber<this, Y>;
  }
}

export type WithNumber<T extends NumberSchema, Y = number> = T & { validation_number: Y };
export type ExtractFromNumber<T> = T extends WithNumber<NumberSchema, infer Y> ? Y : never;
