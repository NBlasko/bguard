import { expectEqualTypes } from '../../jest/setup';
import { BuildSchemaError } from '../exceptions';
import { parseSchema } from '../parseSchema';
import { GetType, V } from '../';
import { minLength } from '../asserts/string/minLength';
import { email } from '../asserts/string/email';

describe('ObjectSchema', () => {
  type UnkownObject = {
    [x: string]: unknown;
  };
  it('should be an object', () => {
    const objectWithNumbersSchema = V().object({ foo: V().number() });
    type MyObjectWithNumbers = {
      foo: number;
    };
    expectEqualTypes<MyObjectWithNumbers, GetType<typeof objectWithNumbersSchema>>(true);
    const myObject = { foo: 5 };
    expect(parseSchema(objectWithNumbersSchema, myObject)).toBe(myObject);
    expect(() => parseSchema(objectWithNumbersSchema, 'not an object')).toThrow(
      'Expected an object but received a different type',
    );
  });

  it('should not build with missing parameters', () => {
    //@ts-expect-error testing invalid schema in runtime
    const invalidObjectSchemaFunction = () => V().object();

    expectEqualTypes<UnkownObject, GetType<ReturnType<typeof invalidObjectSchemaFunction>>>(true);
    expect(invalidObjectSchemaFunction).toThrow('Missing schema in object method');
    expect(invalidObjectSchemaFunction).toThrow(BuildSchemaError);
  });

  it('should not build with invalid primitive parameters', () => {
    //@ts-expect-error testing invalid schema in runtime
    const invalidObjectSchemaFunction = () => V().object('not an object with bguard schema');
    expectEqualTypes<UnkownObject, GetType<ReturnType<typeof invalidObjectSchemaFunction>>>(true);
    expect(invalidObjectSchemaFunction).toThrow('Invalid schema in object method');
    expect(invalidObjectSchemaFunction).toThrow(BuildSchemaError);
  });

  it('should not build with an array parameter', () => {
    //@ts-expect-error testing invalid schema in runtime
    const invalidObjectSchemaFunction = () => V().object(V().array(V().string()));
    expectEqualTypes<UnkownObject, GetType<ReturnType<typeof invalidObjectSchemaFunction>>>(true);
    expect(invalidObjectSchemaFunction).toThrow('Invalid schema in object');
    expect(invalidObjectSchemaFunction).toThrow(BuildSchemaError);
  });

  it('should not run with an array parameter', () => {
    const objectSchema = V().object({ foo: V().string() });
    expectEqualTypes<
      {
        foo: string;
      },
      GetType<typeof objectSchema>
    >(true);
    expect(() => parseSchema(objectSchema, ['foo', 'bar'])).toThrow(
      'Expected an object but received an array. Invalid type of data',
    );
  });

  it('should not run with an invalid keys', () => {
    const objectSchema = V().object({ foo: V().string() });

    expectEqualTypes<
      {
        foo: string;
      },
      GetType<typeof objectSchema>
    >(true);
    expect(() => parseSchema(objectSchema, { foo: 'valid key foo', bar: 'invalid key bar' })).toThrow(
      'This key is not allowed in the object',
    );
  });

  it('should not run with missing required property', () => {
    const objectSchema = V().object({ foo: V().string(), bar: V().string() });

    expectEqualTypes<
      {
        foo: string;
        bar: string;
      },
      GetType<typeof objectSchema>
    >(true);
    expect(() => parseSchema(objectSchema, { foo: 'valid key foo' })).toThrow(
      'Missing required property in the object',
    );
  });

  it('should validate complex object schema', () => {
    const userSchema = V().object({
      email: V().string().custom(email()),
      userName: V().string().optional(),
      verified: V().boolean().onlyTrue().optional(),
      phone: V().number().nullable().optional(),
      address: V().array(V().string().custom(minLength(3))),
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
      GetType<typeof userSchema>
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
      'The received value is not equal to expected',
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
