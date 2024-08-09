import { CommonSchema } from './CommonSchema';
import { panic } from '../exceptions';

const isBoolean = (expected: boolean) => (received: boolean, pathToError: string) => {
  if (received !== expected) panic(expected, received, pathToError, `The received value is not ${expected}`);
};

export class BooleanSchema extends CommonSchema {
  _boolean = 1;
  onlyTrue(): WithBoolean<this, true> {
    return this.custom(isBoolean(true)) as WithBoolean<this, true>;
  }

  onlyFalse(): WithBoolean<this, false> {
    return this.custom(isBoolean(false)) as WithBoolean<this, false>;
  }
}

export type WithBoolean<T extends BooleanSchema, Y = boolean> = T & { validation_boolean: Y };
export type ExtractFromBoolean<T> = T extends WithBoolean<BooleanSchema, infer Y> ? Y : never;
