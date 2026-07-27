import { parse, parseOrFail, ValidationError, setLocale } from '../';
import { array } from '../asserts/array';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { string } from '../asserts/string';
import { tuple } from '../asserts/tuple';
import { email } from '../asserts/string/email';
import { minLength } from '../asserts/string/minLength';

/**
 * An error carries its location twice: `pathToError` for display and `path` as keys for anything that
 * needs to act on it. A string path cannot be taken apart again reliably, because a key may itself
 * contain a dot or a bracket, which is why both are derived from the same key rather than one from the
 * other.
 *
 * `code` is the translation key of the failure. It is what to branch on: unlike `message` it does not
 * change with the locale.
 */
describe('error shape', () => {
  describe('path', () => {
    it('is empty at the root', () => {
      expect(parse(string(), 1)[0]![0]!.path).toEqual([]);
    });

    it('names object properties', () => {
      expect(parse(object({ a: string() }), { a: 1 })[0]![0]!.path).toEqual(['a']);
    });

    it('uses numbers for array indexes', () => {
      expect(parse(array(string()), ['a', 1])[0]![0]!.path).toEqual([1]);
    });

    it('uses numbers for tuple positions', () => {
      expect(parse(tuple([string(), number()]), ['a', 'b'])[0]![0]!.path).toEqual([1]);
    });

    it('names record keys', () => {
      expect(parse(record(string(), number()), { k: 'x' })[0]![0]!.path).toEqual(['k']);
    });

    it('mixes keys and indexes through nesting', () => {
      const schema = object({ users: array(object({ mail: string().custom(email()) })) });

      const [errors] = parse(schema, { users: [{ mail: 'a@b.com' }, { mail: 'nope' }] });

      expect(errors![0]!.path).toEqual(['users', 1, 'mail']);
      expect(errors![0]!.pathToError).toBe('.users[1].mail');
    });

    it('survives a key that would be ambiguous in the string form', () => {
      // '.a.b' as a string cannot be told apart from a nested property, which is the reason the array
      // exists.
      const schema = record(string(), number());

      const [errors] = parse(schema, { 'a.b': 'x' });

      expect(errors![0]!.path).toEqual(['a.b']);
      expect(errors![0]!.pathToError).toBe('.a.b');
    });

    it('is reported on the thrown error too', () => {
      expect.assertions(2);
      try {
        parseOrFail(object({ a: object({ b: string() }) }), { a: { b: 1 } });
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        expect((e as ValidationError).path).toEqual(['a', 'b']);
      }
    });
  });

  describe('code', () => {
    it('is the translation key of the failure', () => {
      expect(parse(string(), 1)[0]![0]!.code).toBe('c:invalidType');
      expect(parse(string().custom(email()), 'nope')[0]![0]!.code).toBe('s:email');
      expect(parse(string().custom(minLength(5)), 'ab')[0]![0]!.code).toBe('s:minLength');
    });

    it('does not change with the locale, unlike the message', () => {
      setLocale('codeLng', { 's:email': 'Neispravan email' });

      const [errors] = parse(string().custom(email()), 'nope', { lng: 'codeLng' });

      expect(errors![0]!.message).toBe('Neispravan email');
      expect(errors![0]!.code).toBe('s:email');
    });

    it('distinguishes failures that share a message path', () => {
      const schema = object({ a: string() });

      expect(parse(schema, {})[0]![0]!.code).toBe('c:requiredProperty');
      expect(parse(schema, { a: 1 })[0]![0]!.code).toBe('c:invalidType');
      expect(parse(schema, { a: 'x', b: 1 })[0]![0]!.code).toBe('c:unrecognizedProperty');
    });

    it('carries the key of a custom assert', () => {
      const schema = string().custom((received: string, ctx) => {
        if (received !== 'ok') ctx.addIssue('ok', received, 'my:ownCode');
      });

      expect(parse(schema, 'no')[0]![0]!.code).toBe('my:ownCode');
    });

    it('is reported on the thrown error too', () => {
      expect.assertions(1);
      try {
        parseOrFail(string(), 1);
      } catch (e) {
        expect((e as ValidationError).code).toBe('c:invalidType');
      }
    });
  });

  describe('every reported error carries the full shape', () => {
    it('includes message, code, both path forms, expected and received', () => {
      const schema = object({ users: array(object({ mail: string().custom(email()) })) });

      const [errors] = parse(schema, { users: [{ mail: 'nope' }] }, { getAllErrors: true });

      expect(errors![0]).toEqual({
        message: 'The received value does not match the required email pattern',
        code: 's:email',
        pathToError: '.users[0].mail',
        path: ['users', 0, 'mail'],
        expected: expect.anything(),
        received: 'nope',
        meta: undefined,
      });
    });
  });
});

describe('the ValidationError constructor', () => {
  // Exported publicly, so the shorter form has to hold up: path and code are optional for a caller
  // building one directly, while everything bguard raises supplies both.
  it('defaults path and code when they are not given', () => {
    const error = new ValidationError('expected', 'received', '.a', 'Something went wrong');

    expect(error.path).toEqual([]);
    expect(error.code).toBe('');
    expect(error.pathToError).toBe('.a');
    expect(error.message).toBe('Something went wrong');
    expect(error.meta).toBeUndefined();
  });

  it('keeps path and code when they are given', () => {
    const error = new ValidationError('e', 'r', '.a[0]', 'msg', { id: 'x' }, ['a', 0], 'c:invalidType');

    expect(error.path).toEqual(['a', 0]);
    expect(error.code).toBe('c:invalidType');
    expect(error.meta).toEqual({ id: 'x' });
  });
});
