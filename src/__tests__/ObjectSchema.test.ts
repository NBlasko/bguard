import { expectEqualTypes } from '../../jest/setup';
import { InferType, object, boolean, string, number, array, parseSchema, BuildSchemaError, ValidationError } from '../';
import { minLength } from '../asserts/string/minLength';
import { email } from '../asserts/string/email';

describe('ObjectSchema', () => {
  type UnkownObject = {
    [x: string]: unknown;
  };
  it('should be an object', () => {
    const objectWithNumbersSchema = object({ foo: number() });
    type MyObjectWithNumbers = {
      foo: number;
    };
    expectEqualTypes<MyObjectWithNumbers, InferType<typeof objectWithNumbersSchema>>(true);
    const myObject = { foo: 5 };
    expect(parseSchema(objectWithNumbersSchema, myObject)).toBe(myObject);
    expect(() => parseSchema(objectWithNumbersSchema, 'not an object')).toThrow(
      'Expected an object but received a different type',
    );
    expect(() => parseSchema(objectWithNumbersSchema, 'not an object')).toThrow(ValidationError);
  });

  it('should not build with missing parameters', () => {
    //@ts-expect-error testing invalid schema in runtime
    const invalidObjectSchemaFunction = () => object();

    expectEqualTypes<UnkownObject, InferType<ReturnType<typeof invalidObjectSchemaFunction>>>(true);
    expect(invalidObjectSchemaFunction).toThrow('Missing schema in object method');
    expect(invalidObjectSchemaFunction).toThrow(BuildSchemaError);
  });

  it('should not build with invalid primitive parameters', () => {
    //@ts-expect-error testing invalid schema in runtime
    const invalidObjectSchemaFunction = () => object('not an object with bguard schema');
    expectEqualTypes<UnkownObject, InferType<ReturnType<typeof invalidObjectSchemaFunction>>>(true);
    expect(invalidObjectSchemaFunction).toThrow('Invalid schema in object method');
    expect(invalidObjectSchemaFunction).toThrow(BuildSchemaError);
  });

  it('should not build with an array parameter', () => {
    //@ts-expect-error testing invalid schema in runtime
    const invalidObjectSchemaFunction = () => object(array(string()));
    expectEqualTypes<UnkownObject, InferType<ReturnType<typeof invalidObjectSchemaFunction>>>(true);
    expect(invalidObjectSchemaFunction).toThrow('Invalid schema in object');
    expect(invalidObjectSchemaFunction).toThrow(BuildSchemaError);
  });

  it('should not run with an array parameter', () => {
    const objectSchema = object({ foo: string() });
    expectEqualTypes<
      {
        foo: string;
      },
      InferType<typeof objectSchema>
    >(true);
    expect(() => parseSchema(objectSchema, ['foo', 'bar'])).toThrow(
      'Expected an object but received an array. Invalid type of data',
    );
  });

  it('should not run with an invalid keys', () => {
    const objectSchema = object({ foo: string() });

    expectEqualTypes<
      {
        foo: string;
      },
      InferType<typeof objectSchema>
    >(true);
    expect(() => parseSchema(objectSchema, { foo: 'valid key foo', bar: 'invalid key bar' })).toThrow(
      'This key is not allowed in the object',
    );
  });

  it('should not run with missing required property', () => {
    const objectSchema = object({ foo: string(), bar: string() });

    expectEqualTypes<
      {
        foo: string;
        bar: string;
      },
      InferType<typeof objectSchema>
    >(true);
    expect(() => parseSchema(objectSchema, { foo: 'valid key foo' })).toThrow(
      'Missing required property in the object',
    );
  });

  it('should validate complex object schema', () => {
    const userSchema = object({
      email: string().custom(email()),
      userName: string().optional(),
      verified: boolean().onlyTrue().optional(),
      phone: number().nullable().optional(),
      address: array(string().custom(minLength(3))),
    });

    interface User {
      email: string;
      address: string[];
      userName?: string | undefined;
      verified?: true | undefined;
      phone?: number | null | undefined;
    }

    expectEqualTypes<
      {
        email: string;
        address: string[];
        userName?: string | undefined;
        verified?: true | undefined;
        phone?: number | null | undefined;
      },
      InferType<typeof userSchema>
    >(true);

    const validUser: User = {
      email: 'foo@foo.com',
      address: ['my adress'],
      phone: null,
      verified: true,
    };

    expect(parseSchema(userSchema, validUser)).toBe(validUser);

    const userWithInvalidAddress: User = {
      email: 'foo@foo.com',
      address: ['my'],
      phone: null,
      verified: true,
    };

    expect(() => parseSchema(userSchema, userWithInvalidAddress)).toThrow(
      'The received value length is less than expected',
    );

    const userWithInvalidEmail: User = {
      email: 'foofoo.com',
      address: ['my'],
      phone: null,
      verified: true,
    };

    expect(() => parseSchema(userSchema, userWithInvalidEmail)).toThrow(
      'The received value does not match the required email pattern',
    );
  });
});
