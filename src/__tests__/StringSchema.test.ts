import { expectEqualTypes } from '../../jest/setup';
import { parseSchema } from '../parseSchema';
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
    const parsedValue = parseSchema(stringSchema, actualString);
    expect(parsedValue).toBe(actualString);
  });

  it('should not be a string', () => {
    const stringSchema = string();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualNumber: number = 9;
    expectEqualTypes<typeof actualNumber, InferType<typeof stringSchema>>(false);
    expect(() => parseSchema(stringSchema, actualNumber)).toThrow('Invalid type of data');
  });

  it('should be an email', () => {
    const emailSchema = string().custom(regExp(emailRegExp));
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const email: string = 'mygoodemail@email.com';
    expectEqualTypes<typeof email, InferType<typeof emailSchema>>(true);
    const parsedValue = parseSchema(emailSchema, email);
    expect(parsedValue).toBe(email);
  });

  it('should not be an email', () => {
    const emailSchema = string().custom(regExp(emailRegExp));
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const email: string = 'mybademailemail.com';
    expectEqualTypes<typeof email, InferType<typeof emailSchema>>(true);
    expect(() => parseSchema(emailSchema, email)).toThrow(
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
    expect(() => parseSchema(stringLiteralSchema, wrongStringLiteral)).toThrow(
      'The received value is not equal to expected',
    );
  });

  it('should be an alphanumeric pattern', () => {
    const alphanumericSchema = string().custom(regExp(/^[A-Za-z0-9]+$/));
    expectEqualTypes<string, InferType<typeof alphanumericSchema>>(true);
    expect(parseSchema(alphanumericSchema, 'valid123')).toBe('valid123');
    expect(() => parseSchema(alphanumericSchema, 'invalid!@#')).toThrow(
      'The received value does not match the required text pattern',
    );
  });

  it('should be an alphanumeric pattern', () => {
    const textSchema = string().custom(maxLength(5));
    expectEqualTypes<string, InferType<typeof textSchema>>(true);
    expect(parseSchema(textSchema, 'short')).toBe('short');
    expect(parseSchema(textSchema, 'yes')).toBe('yes');
    expect(() => parseSchema(textSchema, 'toolong')).toThrow('The received value length is greater than expected');
  });
});
