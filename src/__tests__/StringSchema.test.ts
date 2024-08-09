import { expectEqualTypes } from '../../jest/setup';
import { parseSchema } from '../parseSchema';
import { regExp } from '../asserts/string/regExp';
import { GetType, V } from '../validator';

describe('StringSchema', () => {
  const emailRegExp = /^[^@]+@[^@]+\.[^@]+$/;

  it('should be a string', () => {
    const stringSchema = V().string();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualString: string = 'this is a string';
    expectEqualTypes<typeof actualString, GetType<typeof stringSchema>>(true);
    const parsedValue = parseSchema(stringSchema, actualString);
    expect(parsedValue).toBe(actualString);
  });

  it('should not be a string', () => {
    const stringSchema = V().string();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualNumber: number = 9;
    expectEqualTypes<typeof actualNumber, GetType<typeof stringSchema>>(false);
    expect(() => parseSchema(stringSchema, actualNumber)).toThrow('Invalid type of data');
  });

  it('should be an email', () => {
    const emailSchema = V().string().custom(regExp(emailRegExp));
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const email: string = 'mygoodemail@email.com';
    expectEqualTypes<typeof email, GetType<typeof emailSchema>>(true);
    const parsedValue = parseSchema(emailSchema, email);
    expect(parsedValue).toBe(email);
  });

  it('should not be an email', () => {
    const emailSchema = V().string().custom(regExp(emailRegExp));
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const email: string = 'mybademailemail.com';
    expectEqualTypes<typeof email, GetType<typeof emailSchema>>(true);
    expect(() => parseSchema(emailSchema, email)).toThrow(
      'The received value does not match the required text pattern',
    );
  });

  it('should be equal to', () => {
    const stringLiteralSchema = V().string().equalTo('rightStringLiteral');
    const rightStringLiteral = 'rightStringLiteral';
    const wrongStringLiteral = 'wrongStringLiteral';
    expectEqualTypes<typeof rightStringLiteral, GetType<typeof stringLiteralSchema>>(true);
    expectEqualTypes<typeof wrongStringLiteral, GetType<typeof stringLiteralSchema>>(false);
    expect(rightStringLiteral).toBe(rightStringLiteral);
    expect(() => parseSchema(stringLiteralSchema, wrongStringLiteral)).toThrow(
      'The received value is not equal to expected',
    );
  });
});
