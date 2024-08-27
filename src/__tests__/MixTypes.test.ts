import { expectEqualTypes } from '../../jest/setup';
import { InferType, parseOrFail } from '../';
import { oneOfTypes } from '../asserts/mix';

describe('MixTypes', () => {
  it('should be a string or number', () => {
    const stringOrNumberSchema = oneOfTypes(['number', 'string']);

    expectEqualTypes<string | number, InferType<typeof stringOrNumberSchema>>(true);
    expect(parseOrFail(stringOrNumberSchema, 'this is a string')).toBe('this is a string');
    expect(parseOrFail(stringOrNumberSchema, 5)).toBe(5);
    expect(() => parseOrFail(stringOrNumberSchema, true)).toThrow('Invalid type of data');

    const stringOrBooleanOrUndefinedSchema = oneOfTypes(['boolean', 'string']).optional();

    expectEqualTypes<string | boolean | undefined, InferType<typeof stringOrBooleanOrUndefinedSchema>>(true);
    expect(parseOrFail(stringOrBooleanOrUndefinedSchema, 'this is a string')).toBe('this is a string');
    expect(parseOrFail(stringOrBooleanOrUndefinedSchema, true)).toBe(true);
    expect(parseOrFail(stringOrBooleanOrUndefinedSchema, undefined)).toBe(undefined);
    expect(() => parseOrFail(stringOrBooleanOrUndefinedSchema, 5)).toThrow('Invalid type of data');

    const functionOrBooleanOrUndefinedOrNullSchema = oneOfTypes(['boolean', 'function']).optional().nullable();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    expectEqualTypes<boolean | Function | null | undefined, InferType<typeof functionOrBooleanOrUndefinedOrNullSchema>>(
      true,
    );
    const receivedFunc = () => {};
    expect(parseOrFail(functionOrBooleanOrUndefinedOrNullSchema, receivedFunc)).toBe(receivedFunc);
    expect(parseOrFail(functionOrBooleanOrUndefinedOrNullSchema, true)).toBe(true);
    expect(parseOrFail(functionOrBooleanOrUndefinedOrNullSchema, undefined)).toBe(undefined);
    expect(() => parseOrFail(functionOrBooleanOrUndefinedOrNullSchema, 5)).toThrow('Invalid type of data');
    expect(() => parseOrFail(functionOrBooleanOrUndefinedOrNullSchema, 'this is a string')).toThrow(
      'Invalid type of data',
    );
  });
});
