import { expectEqualTypes } from '../../jest/setup';
import { InferType, number, throwException, string, boolean, parseSchema, ValidationError } from '../';
import { RequiredValidation } from '../schemas/CommonSchema';

describe('CommonSchema', () => {
  it('should be a nullable string', () => {
    const stringOrNullSchema = string().nullable();

    expectEqualTypes<string | null, InferType<typeof stringOrNullSchema>>(true);
    expect(parseSchema(stringOrNullSchema, 'this is a string')).toBe('this is a string');
    expect(parseSchema(stringOrNullSchema, null)).toBe(null);
  });

  it('should be an optional string', () => {
    const stringOrNullSchema = string().optional();

    expectEqualTypes<string | undefined, InferType<typeof stringOrNullSchema>>(true);
    expect(parseSchema(stringOrNullSchema, 'this is a string')).toBe('this is a string');
    expect(parseSchema(stringOrNullSchema, undefined)).toBe(undefined);
  });

  it('should be an optional and nullable string', () => {
    const stringOrNullSchema = string().optional().nullable();

    expectEqualTypes<string | null | undefined, InferType<typeof stringOrNullSchema>>(true);
    expect(parseSchema(stringOrNullSchema, 'this is a string')).toBe('this is a string');
    expect(parseSchema(stringOrNullSchema, undefined)).toBe(undefined);
    expect(parseSchema(stringOrNullSchema, null)).toBe(null);
  });

  it('should fail on required and non nullable field', () => {
    const booleanSchema = boolean();

    expectEqualTypes<boolean, InferType<typeof booleanSchema>>(true);
    expect(parseSchema(booleanSchema, true)).toBe(true);
    expect(() => parseSchema(booleanSchema, null)).toThrow('Value should not be null');
    expect(() => parseSchema(booleanSchema, undefined)).toThrow('The required value is missing');
    expect(() => parseSchema(booleanSchema, null)).toThrow(ValidationError);
    expect(() => parseSchema(booleanSchema, undefined)).toThrow(ValidationError);
  });

  it('should work with custom assert', () => {
    const even = (): RequiredValidation => (received: number, pathToError: string) => {
      if (received % 2 !== 0) throwException('even', received, pathToError, 'The received value is not an even number');
    };

    const numberSchema = number().custom(even());

    expectEqualTypes<number, InferType<typeof numberSchema>>(true);
    expect(parseSchema(numberSchema, 4)).toBe(4);
    expect(() => parseSchema(numberSchema, 3)).toThrow('The received value is not an even number');
    expect(() => parseSchema(numberSchema, 3)).toThrow(ValidationError);
  });
});
