import { expectEqualTypes } from '../../jest/setup';
import { InferType, guardException, parseOrFail, ValidationError } from '../';
import { ExceptionContext, RequiredValidation } from '../commonTypes';
import { string } from '../asserts/string';
import { boolean } from '../asserts/boolean';
import { number } from '../asserts/number';
import { min } from '../asserts/number/min';
import { bigint } from '../asserts/bigint';
import { date } from '../asserts/date';
import { array } from '../asserts/array';
import { object } from '../asserts/object';
import { minLength } from '../asserts/string/minLength';

describe('CommonSchema', () => {
  it('should be a nullable string', () => {
    const stringOrNullSchema = string().nullable();

    expectEqualTypes<string | null, InferType<typeof stringOrNullSchema>>(true);
    expect(parseOrFail(stringOrNullSchema, 'this is a string')).toBe('this is a string');
    expect(parseOrFail(stringOrNullSchema, null)).toBe(null);
  });

  it('should be an optional string', () => {
    const stringOrNullSchema = string().optional();

    expectEqualTypes<string | undefined, InferType<typeof stringOrNullSchema>>(true);
    expect(parseOrFail(stringOrNullSchema, 'this is a string')).toBe('this is a string');
    expect(parseOrFail(stringOrNullSchema, undefined)).toBe(undefined);
  });

  it('should be an optional and nullable string', () => {
    const stringOrNullSchema = string().optional().nullable();

    expectEqualTypes<string | null | undefined, InferType<typeof stringOrNullSchema>>(true);
    expect(parseOrFail(stringOrNullSchema, 'this is a string')).toBe('this is a string');
    expect(parseOrFail(stringOrNullSchema, undefined)).toBe(undefined);
    expect(parseOrFail(stringOrNullSchema, null)).toBe(null);
  });

  it('should fail on required and non nullable field', () => {
    const booleanSchema = boolean();

    expectEqualTypes<boolean, InferType<typeof booleanSchema>>(true);
    expect(parseOrFail(booleanSchema, true)).toBe(true);
    expect(() => parseOrFail(booleanSchema, null)).toThrow('Value should not be null');
    expect(() => parseOrFail(booleanSchema, undefined)).toThrow('The required value is missing');
    expect(() => parseOrFail(booleanSchema, null)).toThrow(ValidationError);
    expect(() => parseOrFail(booleanSchema, undefined)).toThrow(ValidationError);
  });

  it('should work with custom assert', () => {
    const even = (): RequiredValidation => (received: number, ctx: ExceptionContext) => {
      if (received % 2 !== 0) guardException('even', received, ctx, 'The received value is not an even number');
    };

    const numberSchema = number().custom(even());

    expectEqualTypes<number, InferType<typeof numberSchema>>(true);
    expect(parseOrFail(numberSchema, 4)).toBe(4);
    expect(() => parseOrFail(numberSchema, 3)).toThrow('The received value is not an even number');
    expect(() => parseOrFail(numberSchema, 3)).toThrow(ValidationError);
  });

  it('should return default value', () => {
    const numberSchema = number().custom(min(0)).default(8);

    expectEqualTypes<number, InferType<typeof numberSchema>>(true);
    expect(parseOrFail(numberSchema, undefined)).toBe(8);
  });

  it('should throw a Build Error if we try to call some method after default', () => {
    expect(() => number().default(8).custom(min(0))).toThrow('Default value must be the last method called in schema');
  });

  it('should throw a Build Error if we try to call default method after optional', () => {
    expect(() => number().optional().default(8)).toThrow(`Cannot call method 'default' after method 'optional'`);
  });

  it('should throw Build Error on invalid default value', () => {
    expect(() => number().default('8' as unknown as number)).toThrow('Invalid type of data');
    expect(() => string().default(true as unknown as string)).toThrow('Invalid type of data');
    expect(() => boolean().default(8n as unknown as boolean)).toThrow('Invalid type of data');
    expect(() => bigint().default(5 as unknown as bigint)).toThrow('Invalid type of data');
    expect(() => date().default(9n as unknown as Date)).toThrow('The received value is not a valid instance of Date');
    expect(() => array(number()).default(['5' as unknown as number])).toThrow('Invalid type of data');
    expect(() => array(number()).default([5])).not.toThrow();
    expect(() => array(number()).default([])).not.toThrow();
    expect(() => object({ n: array(number()) }).default({ n: [true as unknown as number] })).toThrow(
      'Invalid type of data',
    );
    expect(() => object({ n: array(number()) }).default({ n: [] })).not.toThrow();
    expect(() => object({ n: number() }).default({} as unknown as { n: number })).toThrow(
      'Missing required property in the object',
    );
  });

  it('should transform value', () => {
    const numberSchema = number()
      .custom(min(0))
      .transformBeforeValidation((val: number) => (val === 5 ? 1 : val))
      .transformBeforeValidation((val: number) => (val === 10 ? 0 : val));

    expectEqualTypes<number, InferType<typeof numberSchema>>(true);
    expect(parseOrFail(numberSchema, 8)).toBe(8);
    expect(parseOrFail(numberSchema, 5)).toBe(1);
    expect(parseOrFail(numberSchema, 10)).toBe(0);

    const stringOrNullSchema = string() // forth , check if it is type of string
      .nullable() // third, check if null
      .custom(minLength(3)) // fifth  check if 'The received value length is less than expected'
      .transformBeforeValidation((val) => val + '') // first we do transform
      .transformBeforeValidation((val: string) => (val === '' ? null : val)); // second, do another transform

    expectEqualTypes<string | null, InferType<typeof stringOrNullSchema>>(true);
    expect(parseOrFail(stringOrNullSchema, 1234567)).toBe('1234567');
    expect(parseOrFail(stringOrNullSchema, '')).toBe(null);
    expect(parseOrFail(stringOrNullSchema, 'abcdefg')).toBe('abcdefg');
    expect(() => parseOrFail(stringOrNullSchema, 'a')).toThrow('The received value length is less than expected');
  });
});
