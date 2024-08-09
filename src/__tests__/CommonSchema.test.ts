import { expectEqualTypes } from '../../jest/setup';
import { ValidationError } from '../exceptions';
import { parseSchema } from '../parseSchema';
import { GetType, V } from '../validator';

describe('CommonSchema', () => {
  it('should be a nullable string', () => {
    const stringOrNullSchema = V().string().nullable();

    expectEqualTypes<string | null, GetType<typeof stringOrNullSchema>>(true);
    expect(parseSchema(stringOrNullSchema, 'this is a string')).toBe('this is a string');
    expect(parseSchema(stringOrNullSchema, null)).toBe(null);
  });

  it('should be an optional string', () => {
    const stringOrNullSchema = V().string().optional();

    expectEqualTypes<string | undefined, GetType<typeof stringOrNullSchema>>(true);
    expect(parseSchema(stringOrNullSchema, 'this is a string')).toBe('this is a string');
    expect(parseSchema(stringOrNullSchema, undefined)).toBe(undefined);
  });

  it('should be an optional and nullable string', () => {
    const stringOrNullSchema = V().string().optional().nullable();

    expectEqualTypes<string | null | undefined, GetType<typeof stringOrNullSchema>>(true);
    expect(parseSchema(stringOrNullSchema, 'this is a string')).toBe('this is a string');
    expect(parseSchema(stringOrNullSchema, undefined)).toBe(undefined);
    expect(parseSchema(stringOrNullSchema, null)).toBe(null);
  });

  it('should fail on required and non nullable field', () => {
    const booleanSchema = V().boolean();

    expectEqualTypes<boolean, GetType<typeof booleanSchema>>(true);
    expect(parseSchema(booleanSchema, true)).toBe(true);
    expect(() => parseSchema(booleanSchema, null)).toThrow('Value should not be null');
    expect(() => parseSchema(booleanSchema, undefined)).toThrow('The required value is missing');
    expect(() => parseSchema(booleanSchema, null)).toThrow(ValidationError);
    expect(() => parseSchema(booleanSchema, undefined)).toThrow(ValidationError);
  });
});
