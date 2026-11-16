import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { parse, toJSONSchema } from '../';
import { CommonSchema } from '../core';
import { string } from '../asserts/string';
import { number } from '../asserts/number';
import { email } from '../asserts/string/email';
import { validUrl } from '../asserts/string/validUrl';
import { uuid } from '../asserts/string/uuid';
import { isValidDate } from '../asserts/string/isValidDate';
import { isValidDateTime } from '../asserts/string/isValidDateTime';
import { isValidTime } from '../asserts/string/isValidTime';
import { regExp } from '../asserts/string/regExp';
import { minLength } from '../asserts/string/minLength';
import { maxLength } from '../asserts/string/maxLength';
import { min } from '../asserts/number/min';
import { max } from '../asserts/number/max';
import { minExcluded } from '../asserts/number/minExcluded';
import { maxExcluded } from '../asserts/number/maxExcluded';
import { positive } from '../asserts/number/positive';
import { negative } from '../asserts/number/negative';
import { integer } from '../asserts/number/integer';
import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { minKeys } from '../asserts/object/minKeys';
import { isAlpha } from '../asserts/string/isAlpha';
import { isAlphaNumeric } from '../asserts/string/isAlphaNumeric';
import { isNumeric } from '../asserts/string/isNumeric';
import { isHexColor } from '../asserts/string/isHexColor';
import { isPhoneNumber } from '../asserts/string/isPhoneNumber';

/**
 * Whether a real JSON Schema validator reads the generated document the way bguard reads the schema.
 *
 * The rule is one-directional: **a value bguard accepts must pass the generated document.** The reverse
 * is allowed to fail, because an assertion with no keyword is left out and the document then accepts
 * more. The opposite failure is the harmful one, and it shipped: until 0.11.0 `isValidDate` accepted
 * `2021-02-29` under `format: 'date'`, and until 0.12.0 `email` accepted `ünï@example.com` under
 * `format: 'email'`.
 *
 * Checked with ajv and ajv-formats, the reference implementation of the formats. An earlier check used
 * only valid values and passed throughout, so the inputs here are mostly invalid on purpose: grids of
 * out-of-range numbers and random strings over the characters each format is picky about. The random
 * inputs come from a seeded generator, so a failure reproduces.
 */
const ajv = new Ajv2020({ strict: false });
addFormats(ajv);

/** mulberry32: small, seedable, good enough to spread inputs. */
function seeded(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomStrings(
  seed: number,
  count: number,
  build: (pick: (options: string) => string, int: (n: number) => number) => string,
) {
  const random = seeded(seed);
  const int = (n: number) => Math.floor(random() * n);
  const pick = (options: string) => options[int(options.length)]!;
  return Array.from({ length: count }, () => build(pick, int));
}

const pad = (n: number, width: number) => String(n).padStart(width, '0');
const run = (pick: (options: string) => string, int: (n: number) => number, alphabet: string, max: number) =>
  Array.from({ length: int(max) }, () => pick(alphabet)).join('');

/** The values bguard accepts but the generated document rejects. Expected to be empty. */
function bguardOnly(schema: CommonSchema, values: readonly unknown[]): unknown[] {
  const validate = ajv.compile(toJSONSchema(schema));
  return values.filter((value) => parse(schema, value)[0] === null && !validate(value));
}

/** How many values bguard accepts, so a test cannot pass by accepting nothing. */
const acceptedCount = (schema: CommonSchema, values: readonly unknown[]) =>
  values.filter((value) => parse(schema, value)[0] === null).length;

describe('agreement with JSON Schema validators', () => {
  describe('isValidDate and format: date', () => {
    const schema = string().custom(isValidDate());
    const values: string[] = [];
    for (const year of [0, 4, 100, 1600, 1800, 1900, 1999, 2000, 2004, 2021, 2100, 2400, 9999])
      for (let month = 0; month <= 13; month++)
        for (let day = 0; day <= 32; day++) values.push(`${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`);

    it('accepts nothing the format rejects', () => {
      expect(bguardOnly(schema, values)).toEqual([]);
    });

    it('agrees in both directions, since the two are meant to be the same rule', () => {
      const validate = ajv.compile(toJSONSchema(schema));
      const disagreements = values.filter((value) => (parse(schema, value)[0] === null) !== validate(value));
      expect(disagreements).toEqual([]);
      expect(acceptedCount(schema, values)).toBeGreaterThan(4000);
    });
  });

  describe('isValidDateTime and format: date-time', () => {
    const values = randomStrings(21, 8000, (pick, int) => {
      const offset = [
        `Z`,
        `+${pad(int(30), 2)}:${pad(int(70), 2)}`,
        `-${pad(int(30), 2)}${pad(int(70), 2)}`,
        `+${pad(int(30), 2)}`,
      ][int(4)];
      const fraction = int(2) ? '' : `.${int(1000)}`;
      return `${pad(int(3000), 4)}-${pad(int(14), 2)}-${pad(int(33), 2)}T${pad(int(26), 2)}:${pad(int(62), 2)}:${pad(int(62), 2)}${fraction}${offset}`;
    });

    it.each([
      ['no options', isValidDateTime()],
      ['offsets', isValidDateTime({ offset: true })],
      ['a precision', isValidDateTime({ offset: true, precision: 3 })],
    ])('accepts nothing the format rejects, with %s', (_name, assert) => {
      const schema = string().custom(assert);
      expect(bguardOnly(schema, values)).toEqual([]);
      expect(acceptedCount(schema, values)).toBeGreaterThan(100);
    });
  });

  describe('isValidTime and its pattern', () => {
    const values = randomStrings(
      7,
      5000,
      (pick, int) =>
        `${pad(int(26), 2)}:${pad(int(62), 2)}:${pad(int(62), 2)}${['', `.${pad(int(100), 2)}`, `.${int(10000)}`, '.'][int(4)]}${int(3) ? '' : ['Z', '+01:00'][int(2)]}`,
    );

    it.each([
      ['no options', isValidTime()],
      ['a precision', isValidTime({ precision: 2 })],
    ])('accepts nothing the pattern rejects, with %s', (_name, assert) => {
      const schema = string().custom(assert);
      expect(bguardOnly(schema, values)).toEqual([]);
      expect(acceptedCount(schema, values)).toBeGreaterThan(100);
    });
  });

  describe('email and format: email', () => {
    const schema = string().custom(email());
    // Half from characters the pattern allows, so plenty pass; half from ones it is picky about.
    const values = randomStrings(23, 8000, (pick, int) => {
      const noisy = int(2) === 0;
      const local = run(pick, int, noisy ? 'ab.-_+!#$%&\'*/=?^`{|}~(<"@ü 1' : "ab1.+_'", 8);
      const domain = run(pick, int, noisy ? 'ab.-1ü_' : 'ab1-', 6) + (noisy ? '' : `.${run(pick, int, 'abc', 4)}`);
      return `${local}${int(8) ? '@' : ''}${domain}`;
    });

    it('agrees in both directions, since bguard uses the same pattern', () => {
      const validate = ajv.compile(toJSONSchema(schema));
      expect(values.filter((value) => (parse(schema, value)[0] === null) !== validate(value))).toEqual([]);
      expect(acceptedCount(schema, values)).toBeGreaterThan(100);
    });
  });

  describe('validUrl and format: uri', () => {
    const hosts = [
      'a.com',
      'localhost',
      '10.0.0.1',
      '[::1]',
      '[2001:db8::1]',
      '[::ffff:1.2.3.4]',
      '[1::2::3]',
      'a..b',
      '-a',
      'b@a.com',
      '',
    ];
    const values = randomStrings(42, 8000, (pick, int) => {
      const port = int(3) ? '' : `:${int(70000)}`;
      const rest = run(pick, int, 'aZ09-._~!$&\'()*+,;=:@/?#%<>{}|\\^"ü []', 12);
      return `${['http', 'https'][int(2)]}://${hosts[int(hosts.length)]}${port}${rest}`;
    });

    it.each([
      ['no protocol', validUrl()],
      ['a protocol', validUrl('https')],
    ])('accepts nothing the format rejects, with %s', (_name, assert) => {
      const schema = string().custom(assert);
      expect(bguardOnly(schema, values)).toEqual([]);
      expect(acceptedCount(schema, values)).toBeGreaterThan(100);
    });
  });

  describe('the remaining keywords', () => {
    const strings = randomStrings(5, 3000, (pick, int) => run(pick, int, 'abcABC019-_ .ü', 12));
    // Mostly well-formed, with the odd wrong-length group, stray `g` or missing hyphen.
    const uuids = randomStrings(9, 3000, (pick, int) => {
      const group = (length: number) =>
        Array.from({ length: length + (int(8) === 0 ? 1 : 0) }, () =>
          pick('0123456789abcdefABCDEF' + (int(20) ? '' : 'g')),
        ).join('');
      return [8, 4, 4, 4, 12].map(group).join(int(10) ? '-' : '');
    });
    const numbers = [-Infinity, -1e308, -10, -1, -0.5, -0, 0, 0.5, 1, 4.99, 5, 5.01, 10, 1e308, Infinity, NaN];

    it.each([
      ['uuid', string().custom(uuid()), uuids],
      ['regExp', string().custom(regExp(/^[a-c]+[0-9]?$/)), strings],
      ['minLength and maxLength', string().custom(minLength(2), maxLength(6)), strings],
      ['min', number().custom(min(5)), numbers],
      ['max', number().custom(max(5)), numbers],
      ['minExcluded', number().custom(minExcluded(5)), numbers],
      ['maxExcluded', number().custom(maxExcluded(5)), numbers],
      ['positive', number().custom(positive()), numbers],
      ['negative', number().custom(negative()), numbers],
      ['integer', number().custom(integer()), [...numbers, 1e21, -0, 2.5, Number.MAX_SAFE_INTEGER]],
    ])('%s accepts nothing the document rejects', (_name, schema, values: readonly unknown[]) => {
      expect(bguardOnly(schema, values)).toEqual([]);
      expect(acceptedCount(schema, values)).toBeGreaterThan(0);
    });
  });

  describe('the pattern-based character assertions, which agree in both directions', () => {
    // The pattern is the assertion's own regex, so ajv (which compiles patterns with the `u` flag) has to
    // read it exactly as bguard does, `\p{L}` included.
    const letters = 'aZđĐжЖωé\u0301中';
    const values = randomStrings(11, 6000, (pick, int) =>
      run(pick, int, int(2) ? letters + '0129١' : letters + "0129١ -_.+#½Ⅻ'\n", 8),
    );
    const numeric = randomStrings(13, 6000, (pick, int) => run(pick, int, int(2) ? '0123.+-' : '0123.+-e ,x', 7));
    const colors = randomStrings(17, 6000, (pick, int) => (int(4) ? '#' : '') + run(pick, int, '0aF9g', 10));
    const phones = randomStrings(19, 6000, (pick, int) => (int(4) ? '+' : '') + run(pick, int, '0123456789 -', 18));

    it.each([
      ['isAlpha', string().custom(isAlpha()), values],
      ['isAlphaNumeric', string().custom(isAlphaNumeric()), values],
      ['isNumeric', string().custom(isNumeric()), numeric],
      ['isHexColor', string().custom(isHexColor()), colors],
      ['isPhoneNumber', string().custom(isPhoneNumber()), phones],
    ])('%s', (_name, schema, inputs: readonly string[]) => {
      const validate = ajv.compile(toJSONSchema(schema));
      expect(inputs.filter((value) => (parse(schema, value)[0] === null) !== validate(value))).toEqual([]);
      expect(acceptedCount(schema, inputs)).toBeGreaterThan(50);
    });
  });

  describe('minKeys and minProperties', () => {
    it('agree on objects of every size around the limit', () => {
      const schema = record(string(), number()).custom(minKeys(2));
      const values = [{}, { a: 1 }, { a: 1, b: 2 }, { a: 1, b: 2, c: 3 }];
      expect(bguardOnly(schema, values)).toEqual([]);
      expect(acceptedCount(schema, values)).toBe(2);
    });

    it('agree on an object of optional properties', () => {
      const schema = object({ a: string().optional(), b: string().optional() }).custom(minKeys(1));
      expect(bguardOnly(schema, [{}, { a: 'x' }, { a: 'x', b: 'y' }])).toEqual([]);
    });
  });
});
