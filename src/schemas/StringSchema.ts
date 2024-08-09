import { equalTo } from '../asserts/common/equalTo';
import { CommonSchema } from './CommonSchema';

export class StringSchema extends CommonSchema {
  _string = 1;
  equalTo<Y extends string>(expectedValue: Y): WithString<this, Y> {
    return this.custom(equalTo(expectedValue)) as WithString<this, Y>;
  }
}

export type WithString<T extends StringSchema, Y = string> = T & { validation_string: Y };
export type ExtractFromString<T> = T extends WithString<StringSchema, infer Y> ? Y : never;
