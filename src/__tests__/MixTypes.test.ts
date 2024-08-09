import { expectEqualTypes } from '../../jest/setup';
import { parseSchema } from '../parseSchema';
import { GetType, V } from '../validator';

describe('MixTypes', () => {
  it('should be a string or number', () => {
    const stringOrNumberSchema = V().oneOfTypes(['number', 'string']);

    expectEqualTypes<string | number, GetType<typeof stringOrNumberSchema>>(true);
    expect(parseSchema(stringOrNumberSchema, 'this is a string')).toBe('this is a string');
    expect(parseSchema(stringOrNumberSchema, 5)).toBe(5);
    expect(() => parseSchema(stringOrNumberSchema, true)).toThrow('Invalid type of data');

    const stringOrBooleanOrUndefinedSchema = V().oneOfTypes(['boolean', 'string']).optional();

    expectEqualTypes<string | boolean | undefined, GetType<typeof stringOrBooleanOrUndefinedSchema>>(true);
    expect(parseSchema(stringOrBooleanOrUndefinedSchema, 'this is a string')).toBe('this is a string');
    expect(parseSchema(stringOrBooleanOrUndefinedSchema, true)).toBe(true);
    expect(parseSchema(stringOrBooleanOrUndefinedSchema, undefined)).toBe(undefined);
    expect(() => parseSchema(stringOrBooleanOrUndefinedSchema, 5)).toThrow('Invalid type of data');

    const functionOrBooleanOrUndefinedOrNullSchema = V().oneOfTypes(['boolean', 'function']).optional().nullable();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    expectEqualTypes<boolean | Function | null | undefined, GetType<typeof functionOrBooleanOrUndefinedOrNullSchema>>(
      true,
    );
    const receivedFunc = () => {};
    expect(parseSchema(functionOrBooleanOrUndefinedOrNullSchema, receivedFunc)).toBe(receivedFunc);
    expect(parseSchema(functionOrBooleanOrUndefinedOrNullSchema, true)).toBe(true);
    expect(parseSchema(functionOrBooleanOrUndefinedOrNullSchema, undefined)).toBe(undefined);
    expect(() => parseSchema(functionOrBooleanOrUndefinedOrNullSchema, 5)).toThrow('Invalid type of data');
    expect(() => parseSchema(functionOrBooleanOrUndefinedOrNullSchema, 'this is a string')).toThrow(
      'Invalid type of data',
    );
  });
});
