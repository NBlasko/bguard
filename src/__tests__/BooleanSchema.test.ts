/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectEqualTypes } from '../../jest/setup';
import { parseSchema } from '../parseSchema';
import { GetType, V } from '../validator';

describe('BooleanSchema', () => {
  it('should be a boolean', () => {
    const booleanSchema = V().boolean();
    expectEqualTypes<boolean, GetType<typeof booleanSchema>>(true);
    expect(parseSchema(booleanSchema, true)).toBe(true);
    expect(parseSchema(booleanSchema, false)).toBe(false);
  });

  it('should not be a boolean', () => {
    const booleanSchema = V().boolean();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualNotBoolean: number = 9;

    expectEqualTypes<typeof actualNotBoolean, GetType<typeof booleanSchema>>(false);
    expect(() => parseSchema(booleanSchema, actualNotBoolean)).toThrow('Invalid type of data');
  });

  it('should be true', () => {
    const booleanSchema = V().boolean().onlyTrue();

    expectEqualTypes<true, GetType<typeof booleanSchema>>(true);
    expectEqualTypes<boolean, GetType<typeof booleanSchema>>(false);
    expect(parseSchema(booleanSchema, true)).toBe(true);
    expect(() => parseSchema(booleanSchema, false)).toThrow('The received value is not true');
  });

  it('should be false', () => {
    const booleanSchema = V().boolean().onlyFalse();

    expectEqualTypes<false, GetType<typeof booleanSchema>>(true);
    expectEqualTypes<boolean, GetType<typeof booleanSchema>>(false);
    expect(parseSchema(booleanSchema, false)).toBe(false);
    expect(() => parseSchema(booleanSchema, true)).toThrow('The received value is not false');
  });

  it('should have proper types', () => {
    const booleanSchema = V().boolean();
    const booleanOrNullSchema = V().boolean().nullable();
    const booleanOrUndefinedSchema = V().boolean().optional();
    const booleanOrNullOrUndefinedSchema = V().boolean().nullable().optional();

    expectEqualTypes<boolean, GetType<typeof booleanSchema>>(true);
    expectEqualTypes<boolean | null, GetType<typeof booleanOrNullSchema>>(true);
    expectEqualTypes<boolean | undefined, GetType<typeof booleanOrUndefinedSchema>>(true);
    expectEqualTypes<boolean | null | undefined, GetType<typeof booleanOrNullOrUndefinedSchema>>(true);

    const falseSchema = V().boolean().onlyFalse();
    const falseOrNullSchema = V().boolean().onlyFalse().nullable();
    const falseOrUndefinedSchema = V().boolean().onlyFalse().optional();
    const falseOrNullOrUndefinedSchema = V().boolean().onlyFalse().nullable().optional();

    expectEqualTypes<false, GetType<typeof falseSchema>>(true);
    expectEqualTypes<false | null, GetType<typeof falseOrNullSchema>>(true);
    expectEqualTypes<false | undefined, GetType<typeof falseOrUndefinedSchema>>(true);
    expectEqualTypes<false | null | undefined, GetType<typeof falseOrNullOrUndefinedSchema>>(true);

    const trueSchema = V().boolean().onlyTrue();
    const trueOrNullSchema = V().boolean().onlyTrue().nullable();
    const trueOrUndefinedSchema = V().boolean().onlyTrue().optional();
    const trueOrNullOrUndefinedSchema = V().boolean().onlyTrue().nullable().optional();

    expectEqualTypes<true, GetType<typeof trueSchema>>(true);
    expectEqualTypes<true | null, GetType<typeof trueOrNullSchema>>(true);
    expectEqualTypes<true | undefined, GetType<typeof trueOrUndefinedSchema>>(true);
    expectEqualTypes<true | null | undefined, GetType<typeof trueOrNullOrUndefinedSchema>>(true);
  });
});
