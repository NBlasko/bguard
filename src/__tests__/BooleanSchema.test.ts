/* eslint-disable @typescript-eslint/no-unused-vars */
import { expectEqualTypes } from '../../jest/setup';
import { parseOrFail } from '../parseOrFail';
import { InferType } from '../InferType';
import { boolean } from '../asserts/boolean';

describe('BooleanSchema', () => {
  it('should be a boolean', () => {
    const booleanSchema = boolean();
    expectEqualTypes<boolean, InferType<typeof booleanSchema>>(true);
    expect(parseOrFail(booleanSchema, true)).toBe(true);
    expect(parseOrFail(booleanSchema, false)).toBe(false);
  });

  it('should not be a boolean', () => {
    const booleanSchema = boolean();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualNotBoolean: number = 9;

    expectEqualTypes<typeof actualNotBoolean, InferType<typeof booleanSchema>>(false);
    expect(() => parseOrFail(booleanSchema, actualNotBoolean)).toThrow('Invalid type of data');
  });

  it('should be true', () => {
    const booleanSchema = boolean().onlyTrue();

    expectEqualTypes<true, InferType<typeof booleanSchema>>(true);
    expectEqualTypes<boolean, InferType<typeof booleanSchema>>(false);
    expect(parseOrFail(booleanSchema, true)).toBe(true);
    expect(() => parseOrFail(booleanSchema, false)).toThrow('The received value is not true');
  });

  it('should be false', () => {
    const booleanSchema = boolean().onlyFalse();

    expectEqualTypes<false, InferType<typeof booleanSchema>>(true);
    expectEqualTypes<boolean, InferType<typeof booleanSchema>>(false);
    expect(parseOrFail(booleanSchema, false)).toBe(false);
    expect(() => parseOrFail(booleanSchema, true)).toThrow('The received value is not false');
  });

  it('should have proper types', () => {
    const booleanSchema = boolean();
    const booleanOrNullSchema = boolean().nullable();
    const booleanOrUndefinedSchema = boolean().optional();
    const booleanOrNullOrUndefinedSchema = boolean().nullable().optional();

    expectEqualTypes<boolean, InferType<typeof booleanSchema>>(true);
    expectEqualTypes<boolean | null, InferType<typeof booleanOrNullSchema>>(true);
    expectEqualTypes<boolean | undefined, InferType<typeof booleanOrUndefinedSchema>>(true);
    expectEqualTypes<boolean | null | undefined, InferType<typeof booleanOrNullOrUndefinedSchema>>(true);

    const falseSchema = boolean().onlyFalse();
    const falseOrNullSchema = boolean().onlyFalse().nullable();
    const falseOrUndefinedSchema = boolean().onlyFalse().optional();
    const falseOrNullOrUndefinedSchema = boolean().onlyFalse().nullable().optional();

    expectEqualTypes<false, InferType<typeof falseSchema>>(true);
    expectEqualTypes<false | null, InferType<typeof falseOrNullSchema>>(true);
    expectEqualTypes<false | undefined, InferType<typeof falseOrUndefinedSchema>>(true);
    expectEqualTypes<false | null | undefined, InferType<typeof falseOrNullOrUndefinedSchema>>(true);

    const trueSchema = boolean().onlyTrue();
    const trueOrNullSchema = boolean().onlyTrue().nullable();
    const trueOrUndefinedSchema = boolean().onlyTrue().optional();
    const trueOrNullOrUndefinedSchema = boolean().onlyTrue().nullable().optional();

    expectEqualTypes<true, InferType<typeof trueSchema>>(true);
    expectEqualTypes<true | null, InferType<typeof trueOrNullSchema>>(true);
    expectEqualTypes<true | undefined, InferType<typeof trueOrUndefinedSchema>>(true);
    expectEqualTypes<true | null | undefined, InferType<typeof trueOrNullOrUndefinedSchema>>(true);
  });
});
