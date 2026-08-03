import { expectEqualTypes } from '../../jest/setup';
import { parse, parseOrFail, readsAffectedBy, type InferType, type RefRead } from '../';
import { ExceptionContext } from '../core';
import { pickPath } from '../helpers/pickPath';
import { array } from '../asserts/array';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';

/**
 * `ctx.ref` taking a property-access callback instead of a string.
 *
 * A string path cannot be checked by anything: `ctx.ref('pasword')` is a valid string, so it yields
 * `undefined` for ever and the comparison quietly succeeds or quietly fails. The callback is checked
 * by the compiler, and it hands back the property's own type instead of `unknown`.
 */

type Signup = InferType<typeof signupSchema>;

const signupSchema = object({
  password: string(),
  age: number(),
  home: object({ city: string() }),
  rows: array(string()),
  confirm: string().custom((received: string, ctx: ExceptionContext) => {
    // The type is inferred: this compares two strings, with no cast.
    if (received !== ctx.ref((root: Signup) => root.password)) {
      ctx.addIssue('a match', received, 'u:mismatch');
    }
  }),
});

const VALID: Signup = {
  password: 'p',
  age: 3,
  home: { city: 'NS' },
  rows: ['a', 'b'],
  confirm: 'p',
};

describe('pickPath', () => {
  it('records a single property', () => {
    expect(pickPath<Signup>((root) => root.password)).toEqual(['password']);
  });

  it('records a nested path', () => {
    expect(pickPath<Signup>((root) => root.home.city)).toEqual(['home', 'city']);
  });

  it('records an array index as a STRING, the way the string form does', () => {
    // `'rows.0'.split('.')` is `['rows', '0']`, and a JavaScript array reads `['0']` as its first
    // element — so both forms of `ref` walk identically from here on.
    expect(pickPath<Signup>((root) => root.rows[0])).toEqual(['rows', '0']);
  });

  it('records `length`, which a real rule reads', () => {
    expect(pickPath<Signup>((root) => root.rows.length)).toEqual(['rows', 'length']);
  });

  it('records nothing for a callback that reads nothing', () => {
    expect(pickPath<Signup>((root) => root)).toEqual([]);
  });

  it('hands back undefined for a symbol, so an implicit conversion fails visibly', () => {
    // Returning the recorder here would append `Symbol(Symbol.toPrimitive)` to the path and carry
    // on, producing an answer that is wrong rather than an error that is obvious.
    let seen: unknown = 'not read';
    pickPath<Signup>((root) => {
      seen = (root as unknown as Record<symbol, unknown>)[Symbol.toPrimitive];
      return root.password;
    });

    expect(seen).toBeUndefined();
  });

  it('throws rather than guessing when the callback CALLS something mid-path', () => {
    // The target is a plain object, so this is a TypeError. Recording `filter` as a segment and
    // returning a path that cannot resolve would be a quiet wrong answer.
    expect(() => pickPath<Signup>((root) => (root.rows as unknown as { filter: () => unknown }).filter())).toThrow(
      TypeError,
    );
  });
});

describe('ctx.ref with a callback', () => {
  it('resolves the value, and the rule passes when they match', () => {
    expect(parseOrFail(signupSchema, VALID)).toEqual(VALID);
  });

  it('fails the rule when they do not match', () => {
    const [errors] = parse(signupSchema, { ...VALID, confirm: 'other' });

    expect(errors).toHaveLength(1);
    expect(errors![0]!.pathToError).toBe('.confirm');
    expect(errors![0]!.code).toBe('u:mismatch');
  });

  it('reads a nested property', () => {
    const seen: unknown[] = [];
    const schema = object({
      home: object({ city: string() }),
      label: string().custom((received: string, ctx: ExceptionContext) => {
        seen.push(ctx.ref((root: { home: { city: string } }) => root.home.city));
        void received;
      }),
    });

    parseOrFail(schema, { home: { city: 'NS' }, label: 'x' });
    expect(seen).toEqual(['NS']);
  });

  it('reads an array element and a length', () => {
    const seen: unknown[] = [];
    const schema = object({
      rows: array(string()),
      label: string().custom((received: string, ctx: ExceptionContext) => {
        seen.push(ctx.ref((root: { rows: string[] }) => root.rows[0]));
        seen.push(ctx.ref((root: { rows: string[] }) => root.rows.length));
        void received;
      }),
    });

    parseOrFail(schema, { rows: ['first', 'second'], label: 'x' });
    expect(seen).toEqual(['first', 2]);
  });

  it('yields undefined for a path that runs past the end of the data', () => {
    const seen: unknown[] = [];
    const schema = object({
      label: string().custom((received: string, ctx: ExceptionContext) => {
        seen.push(ctx.ref((root: { missing?: { deeper?: string } }) => root.missing?.deeper));
        void received;
      }),
    });

    parseOrFail(schema, { label: 'x' });
    expect(seen).toEqual([undefined]);
  });

  it('reads the value the parse STARTED with, like the string form', () => {
    const seen: unknown[] = [];
    const schema = object({
      source: string().transformBeforeValidation((value) => `${value}!`),
      label: string().custom((received: string, ctx: ExceptionContext) => {
        seen.push(ctx.ref((root: { source: string }) => root.source));
        void received;
      }),
    });

    parseOrFail(schema, { source: 'raw', label: 'x' });
    // 'raw', not 'raw!' — a cross-property comparison means the same thing however the value is
    // later reshaped.
    expect(seen).toEqual(['raw']);
  });

  it('records the read the same way the string form does', () => {
    const refReads: RefRead[] = [];
    parseOrFail(signupSchema, VALID, { refReads });

    expect(refReads).toEqual([{ from: ['confirm'], fromPath: '.confirm', to: 'password', toPath: ['password'] }]);
  });

  it('records a nested callback path with a dotted `to`, so the graph does not care which form was used', () => {
    const refReads: RefRead[] = [];
    const schema = object({
      home: object({ city: string() }),
      work: object({
        city: string().custom((received: string, ctx: ExceptionContext) => {
          if (received !== ctx.ref((root: { home: { city: string } }) => root.home.city)) {
            ctx.addIssue('a match', received, 'u:mismatch');
          }
        }),
      }),
    });

    parseOrFail(schema, { home: { city: 'NS' }, work: { city: 'NS' } }, { refReads });

    expect(refReads).toEqual([
      { from: ['work', 'city'], fromPath: '.work.city', to: 'home.city', toPath: ['home', 'city'] },
    ]);
    // And it feeds `readsAffectedBy` identically.
    expect(readsAffectedBy(refReads, 'home.city').map((read) => read.fromPath)).toEqual(['.work.city']);
  });

  it('reaches a key that CONTAINS a dot, which the string form cannot', () => {
    // `ref('user.name')` splits into two segments and finds nothing. The callback records the
    // property as the single key it is, so this is the only way to address such a field.
    const seen: unknown[] = [];
    const schema = object({
      'user.name': string(),
      label: string().custom((received: string, ctx: ExceptionContext) => {
        seen.push(ctx.ref('user.name'));
        seen.push(ctx.ref((root: { 'user.name': string }) => root['user.name']));
        void received;
      }),
    });

    parseOrFail(schema, { 'user.name': 'nikola', label: 'x' });

    expect(seen).toEqual([undefined, 'nikola']);
  });

  it('records a dotted key as ONE segment, so `toPath` stays exact', () => {
    // `to` joins with a dot and is therefore ambiguous for such a key — 'user.name' reads as two
    // segments. `toPath` is the form to compare on, which is why both are recorded.
    const refReads: RefRead[] = [];
    const schema = object({
      'user.name': string(),
      label: string().custom((received: string, ctx: ExceptionContext) => {
        void ctx.ref((root: { 'user.name': string }) => root['user.name']);
        void received;
      }),
    });

    parseOrFail(schema, { 'user.name': 'nikola', label: 'x' }, { refReads });

    expect(refReads[0]!.toPath).toEqual(['user.name']);
    expect(refReads[0]!.to).toBe('user.name');
  });

  /**
   * The compile-time half, which is the whole reason for the callback and is checked by nothing at
   * runtime. `jest/config.ts` turns `isolatedModules` off precisely so these are enforced.
   */
  it('hands back the property type rather than unknown, and refuses a name the shape has not', () => {
    const schema = object({
      password: string(),
      age: number(),
      home: object({ city: string() }),
      probe: string().custom((received: string, ctx: ExceptionContext) => {
        const asString = ctx.ref((root: Signup) => root.password);
        const asNumber = ctx.ref((root: Signup) => root.age);
        const nested = ctx.ref((root: Signup) => root.home.city);

        expectEqualTypes<typeof asString, string>(true);
        expectEqualTypes<typeof asNumber, number>(true);
        expectEqualTypes<typeof nested, string>(true);
        // Read as values too, so the assertions above are the only thing unusual about them.
        expect([asString, asNumber, nested]).toEqual(['p', 1, 'NS']);

        // The string form is deliberately still `unknown`: nothing can check it.
        const legacy = ctx.ref('password');
        expectEqualTypes<typeof legacy, unknown>(true);
        expect(legacy).toBe('p');

        // @ts-expect-error 'pasword' does not exist on Signup — the typo this feature exists to catch
        ctx.ref((root: Signup) => root.pasword);

        // @ts-expect-error a number is not a string
        const wrong: string = ctx.ref((root: Signup) => root.age);
        void wrong;

        // Explicit type arguments are all or none, which is why the root is annotated on the
        // parameter instead. Supplying one of two does not compile.
        // @ts-expect-error Expected 2 type arguments, but got 1
        ctx.ref<Signup>((root) => root.password);

        void received;
      }),
    });

    expect(parseOrFail(schema, { password: 'p', age: 1, home: { city: 'NS' }, probe: 'x' })).toBeTruthy();
  });

  it('leaves the string form working, unchanged', () => {
    const schema = object({
      password: string(),
      confirm: string().custom((received: string, ctx: ExceptionContext) => {
        if (received !== ctx.ref('password')) ctx.addIssue('a match', received, 'u:mismatch');
      }),
    });

    expect(parseOrFail(schema, { password: 'p', confirm: 'p' })).toEqual({ password: 'p', confirm: 'p' });
    const [errors] = parse(schema, { password: 'p', confirm: 'q' });
    expect(errors).toHaveLength(1);
  });
});
