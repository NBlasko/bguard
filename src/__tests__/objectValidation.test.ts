import { parse, parseOrFail } from '../';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { partial as partialOf } from '../asserts/object/partial';

const messagesOf = (result: ReturnType<typeof parse>) => (result[0] ?? []).map((e) => e.message);

describe('object validation', () => {
  describe('unrecognized properties', () => {
    // The check used to ask whether `shapeSchema[key]` was undefined. Keys that exist on
    // Object.prototype answer that with an inherited function, so they were treated as declared,
    // accepted, and then silently dropped from the parsed output.
    it.each(['constructor', 'toString', 'valueOf', 'hasOwnProperty', 'isPrototypeOf'])(
      'rejects the inherited key %s',
      (key) => {
        const schema = object({ foo: string() });

        expect(() => parseOrFail(schema, { foo: 'ok', [key]: 'evil' })).toThrow(
          'This property is not allowed in the object',
        );
      },
    );

    it('rejects an own __proto__ key without polluting Object.prototype', () => {
      const schema = object({ foo: string() });
      const received = JSON.parse('{"foo":"ok","__proto__":{"polluted":true}}') as Record<string, unknown>;

      expect(() => parseOrFail(schema, received)).toThrow('This property is not allowed in the object');
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });

    it('still rejects an ordinary unknown key', () => {
      expect(() => parseOrFail(object({ foo: string() }), { foo: 'ok', bar: 1 })).toThrow(
        'This property is not allowed in the object',
      );
    });

    it('still allows extra keys under allowUnrecognized, stripping them', () => {
      const schema = object({ foo: string() }).allowUnrecognized();

      expect(parseOrFail(schema, { foo: 'ok', bar: 1, constructor: 'x' })).toEqual({ foo: 'ok' });
    });
  });

  describe('getAllErrors reporting', () => {
    it('reports a missing property once', () => {
      // The missing value was reported as a missing property and then again, by innerCheck, as a
      // missing required value.
      const result = parse(object({ foo: string() }), {}, { getAllErrors: true });

      expect(messagesOf(result)).toEqual(['Missing required property in the object']);
    });

    it('does not invent property errors for a non-object', () => {
      // Object.keys('nope') is ['0','1','2','3'], so walking the shape of a string used to add four
      // unrecognized-property errors plus a missing-property pair on top of the type error.
      const result = parse(object({ foo: string() }), 'nope', { getAllErrors: true });

      expect(messagesOf(result)).toEqual(['Expected an object but received a different type']);
    });

    it('reports an array as the wrong type, once', () => {
      const result = parse(object({ foo: string() }), [1, 2], { getAllErrors: true });

      expect(messagesOf(result)).toEqual(['Expected an object but received an array. Invalid type of data']);
    });

    it('still reports every genuinely failing property', () => {
      const schema = object({ a: string(), b: string(), c: string() });

      const result = parse(schema, { a: 1, b: 2, c: 'ok' }, { getAllErrors: true });

      expect(messagesOf(result)).toEqual(['Invalid type of data', 'Invalid type of data']);
      expect((result[0] ?? []).map((e) => e.pathToError)).toEqual(['.a', '.b']);
    });
  });

  describe('default values on properties', () => {
    it('applies a default for a missing property', () => {
      // The missing-property check ran before innerCheck could substitute the default, so a
      // defaulted property was reported as missing and default() could never apply to one.
      const schema = object({ a: number().default(8), b: string() });

      expect(parseOrFail(schema, { b: 'x' })).toEqual({ a: 8, b: 'x' });
    });

    it('prefers an explicitly provided value over the default', () => {
      const schema = object({ a: number().default(8), b: string() });

      expect(parseOrFail(schema, { a: 3, b: 'x' })).toEqual({ a: 3, b: 'x' });
    });

    it('still requires a property that has no default', () => {
      const schema = object({ a: number().default(8), b: string() });

      expect(() => parseOrFail(schema, {})).toThrow('Missing required property in the object');
    });

    it('validates a defaulted property when a value is given', () => {
      const schema = object({ a: number().default(8) });

      expect(() => parseOrFail(schema, { a: 'not a number' })).toThrow('Invalid type of data');
    });
  });
});

describe('which properties the output carries', () => {
  // An absent optional property used to come back as a present key holding undefined. Object.keys and
  // `in` both reported a field nobody sent, and JSON.stringify hid it by dropping such keys — which is
  // why it went unnoticed. It matters most for `partial`, whose whole purpose is answering "which
  // fields did the caller send?".
  it('omits an optional property that was absent', () => {
    const parsed = parseOrFail(object({ a: string().optional(), b: string() }), { b: 'x' });

    expect(Object.keys(parsed)).toEqual(['b']);
    expect('a' in parsed).toBe(false);
  });

  it('keeps a property the input held, even as undefined', () => {
    // The caller did send it, so dropping it would be just as unfaithful.
    const parsed = parseOrFail(object({ a: string().optional() }), { a: undefined });

    expect(Object.keys(parsed)).toEqual(['a']);
    expect(parsed.a).toBeUndefined();
  });

  it('carries a defaulted property that was absent, since it now has a value', () => {
    const parsed = parseOrFail(object({ a: number().default(7), b: string() }), { b: 'x' });

    expect(Object.keys(parsed).sort()).toEqual(['a', 'b']);
    expect(parsed.a).toBe(7);
  });

  it('lets a partial schema report exactly the fields that were sent', () => {
    const patchSchema = partialOf(object({ id: string(), name: string(), secret: string() }));

    expect(Object.keys(parseOrFail(patchSchema, {}))).toEqual([]);
    expect(Object.keys(parseOrFail(patchSchema, { name: 'a' }))).toEqual(['name']);
  });

  it('still carries every property of a fully supplied object', () => {
    const parsed = parseOrFail(object({ a: string(), b: string().optional() }), { a: 'x', b: 'y' });

    expect(Object.keys(parsed).sort()).toEqual(['a', 'b']);
  });
});
