import { expectEqualTypes } from '../../jest/setup';
import { InferType, number, guardException, string, boolean, parseOrFail, ValidationError } from '../';
import { ExceptionContext, RequiredValidation } from '../schemas/CommonSchema';

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
});
