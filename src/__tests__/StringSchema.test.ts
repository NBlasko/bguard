import { expectEqualTypes } from '../../jest/setup';
import { parseOrFail } from '../parseOrFail';
import { regExp } from '../asserts/string/regExp';
import { InferType } from '../';
import { string } from '../asserts/string';
import { maxLength } from '../asserts/string/maxLength';

describe('StringSchema', () => {
  const emailRegExp = /^[^@]+@[^@]+\.[^@]+$/;

  it('should be a string', () => {
    const stringSchema = string();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualString: string = 'this is a string';
    expectEqualTypes<typeof actualString, InferType<typeof stringSchema>>(true);
    const parsedValue = parseOrFail(stringSchema, actualString);
    expect(parsedValue).toBe(actualString);
  });

  it('should not be a string', () => {
    const stringSchema = string();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualNumber: number = 9;
    expectEqualTypes<typeof actualNumber, InferType<typeof stringSchema>>(false);
    expect(() => parseOrFail(stringSchema, actualNumber)).toThrow('Invalid type of data');
  });

  it('should be an email', () => {
    const emailSchema = string().custom(regExp(emailRegExp));
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const email: string = 'mygoodemail@email.com';
    expectEqualTypes<typeof email, InferType<typeof emailSchema>>(true);
    const parsedValue = parseOrFail(emailSchema, email);
    expect(parsedValue).toBe(email);
  });

  it('should not be an email', () => {
    const emailSchema = string().custom(regExp(emailRegExp));
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const email: string = 'mybademailemail.com';
    expectEqualTypes<typeof email, InferType<typeof emailSchema>>(true);
    expect(() => parseOrFail(emailSchema, email)).toThrow(
      'The received value does not match the required text pattern',
    );
  });

  it('should be equal to', () => {
    const stringLiteralSchema = string().equalTo('rightStringLiteral');
    const rightStringLiteral = 'rightStringLiteral';
    const wrongStringLiteral = 'wrongStringLiteral';
    expectEqualTypes<typeof rightStringLiteral, InferType<typeof stringLiteralSchema>>(true);
    expectEqualTypes<typeof wrongStringLiteral, InferType<typeof stringLiteralSchema>>(false);
    expect(rightStringLiteral).toBe(rightStringLiteral);
    expect(() => parseOrFail(stringLiteralSchema, wrongStringLiteral)).toThrow(
      'The received value is not equal to expected',
    );
  });

  it('should be an alphanumeric pattern', () => {
    const alphanumericSchema = string().custom(regExp(/^[A-Za-z0-9]+$/));
    expectEqualTypes<string, InferType<typeof alphanumericSchema>>(true);
    expect(parseOrFail(alphanumericSchema, 'valid123')).toBe('valid123');
    expect(() => parseOrFail(alphanumericSchema, 'invalid!@#')).toThrow(
      'The received value does not match the required text pattern',
    );
  });

  it('should be an alphanumeric pattern', () => {
    const textSchema = string().custom(maxLength(5));
    expectEqualTypes<string, InferType<typeof textSchema>>(true);
    expect(parseOrFail(textSchema, 'short')).toBe('short');
    expect(parseOrFail(textSchema, 'yes')).toBe('yes');
    expect(() => parseOrFail(textSchema, 'toolong')).toThrow('The received value length is greater than expected');
  });

  it('should be equal to one of provided values', () => {
    const textSchema = string().oneOfValues(['foo', 'bar']);
    expectEqualTypes<'foo' | 'bar', InferType<typeof textSchema>>(true);
    expect(parseOrFail(textSchema, 'foo')).toBe('foo');
    expect(parseOrFail(textSchema, 'bar')).toBe('bar');
    expect(() => parseOrFail(textSchema, 'baz')).toThrow('The received value is not equal to expected');
  });
});
