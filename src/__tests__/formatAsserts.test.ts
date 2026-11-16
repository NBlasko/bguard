import { BuildSchemaError, parse, parseOrFail, toJSONSchema } from '../';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { string } from '../asserts/string';
import { integer } from '../asserts/number/integer';
import { minKeys } from '../asserts/object/minKeys';
import { maxKeys } from '../asserts/object/maxKeys';
import { isAlpha } from '../asserts/string/isAlpha';
import { isAlphaNumeric } from '../asserts/string/isAlphaNumeric';
import { isCreditCard } from '../asserts/string/isCreditCard';
import { isHexColor } from '../asserts/string/isHexColor';
import { isJson } from '../asserts/string/isJson';
import { isNumeric } from '../asserts/string/isNumeric';
import { isPhoneNumber } from '../asserts/string/isPhoneNumber';
import { CommonSchema } from '../core';

/** The code of the first issue, or null when the value passes. */
const codeOf = (schema: CommonSchema, value: unknown) => parse(schema, value)[0]?.[0]?.code ?? null;

describe('isAlpha', () => {
  const schema = string().custom(isAlpha());

  it.each([
    ['ASCII letters', 'Nikola'],
    ['Latin letters with diacritics', 'Đorđe'],
    ['Cyrillic', 'Ђорђе'],
    ['Greek', 'Ωμέγα'],
    ['Han characters', '中文'],
    ['a precomposed é', 'café'],
    ['an e followed by a combining acute accent', 'café'],
  ])('accepts %s', (_name, value) => {
    expect(parseOrFail(schema, value)).toBe(value);
  });

  it.each([
    ['the empty string', ''],
    ['a space', 'Ana Marija'],
    ['a hyphen', 'Jean-Luc'],
    ['a digit', 'R2D2'],
    ['a line break', 'abc\n'],
    ['a combining mark with no letter before it', '́a'],
    ['a vulgar fraction', '½'],
  ])('rejects %s', (_name, value) => {
    expect(codeOf(schema, value)).toBe('s:isAlpha');
  });
});

describe('isAlphaNumeric', () => {
  const schema = string().custom(isAlphaNumeric());

  it.each([['abc123'], ['Šifra2024'], ['2024'], ['Ђ7'], ['١٢٣']])('accepts %p', (value) => {
    expect(parseOrFail(schema, value)).toBe(value);
  });

  it.each([
    ['the empty string', ''],
    ['an underscore', 'user_name'],
    ['a space', 'a 1'],
    ['a hyphen', 'a-1'],
    ['a Roman numeral, which is a number but not a digit', 'Ⅻ'],
    ['a vulgar fraction', '½'],
  ])('rejects %s', (_name, value) => {
    expect(codeOf(schema, value)).toBe('s:isAlphaNumeric');
  });
});

describe('isNumeric', () => {
  const schema = string().custom(isNumeric());

  it.each([['0'], ['007'], ['-1'], ['+1'], ['12.5'], ['-0.5'], ['.5']])('accepts %p', (value) => {
    expect(parseOrFail(schema, value)).toBe(value);
  });

  it.each([
    ['the empty string, which Number reads as 0', ''],
    ['whitespace', ' '],
    ['a leading space', ' 1'],
    ['a trailing dot', '1.'],
    ['an exponent', '1e5'],
    ['a thousands separator', '1,000'],
    ['Infinity', 'Infinity'],
    ['NaN', 'NaN'],
    ['hexadecimal', '0x10'],
    ['two signs', '--1'],
    ['a sign alone', '+'],
  ])('rejects %s', (_name, value) => {
    expect(codeOf(schema, value)).toBe('s:isNumeric');
  });
});

describe('isHexColor', () => {
  const schema = string().custom(isHexColor());

  it.each([['#fff'], ['#FFFF'], ['#1e90ff'], ['#1E90FF80']])('accepts %p', (value) => {
    expect(parseOrFail(schema, value)).toBe(value);
  });

  it.each([['fff'], ['#ff'], ['#fffff'], ['#fffffff'], ['#1e90ff8'], ['#ggg'], ['#fff '], ['']])(
    'rejects %p',
    (value) => {
      expect(codeOf(schema, value)).toBe('s:isHexColor');
    },
  );
});

describe('isPhoneNumber', () => {
  const schema = string().custom(isPhoneNumber());

  it.each([['+381641234567'], ['+12025550123'], ['+447911123456'], ['+123456789012345']])('accepts %p', (value) => {
    expect(parseOrFail(schema, value)).toBe(value);
  });

  it.each([
    ['no country code', '0641234567'],
    ['a country code starting with 0', '+0641234567'],
    ['spaces', '+381 64 123 4567'],
    ['dashes', '+1-202-555-0123'],
    ['brackets', '+1(202)5550123'],
    ['16 digits, one more than E.164 allows', '+1234567890123456'],
    ['a plus alone', '+'],
    ['two plus signs', '++381641234567'],
  ])('rejects %s', (_name, value) => {
    expect(codeOf(schema, value)).toBe('s:isPhoneNumber');
  });
});

describe('isCreditCard', () => {
  const schema = string().custom(isCreditCard());

  // Test numbers published by the card networks for exactly this purpose.
  it.each([
    ['Visa', '4111111111111111'],
    ['Visa, grouped by spaces', '4111 1111 1111 1111'],
    ['Visa, grouped by hyphens', '4111-1111-1111-1111'],
    ['Visa with 13 digits', '4222222222222'],
    ['American Express, 15 digits', '378282246310005'],
    ['Discover', '6011111111111117'],
    ['Mastercard', '5555555555554444'],
  ])('accepts %s', (_name, value) => {
    // Returned as received, separators and all.
    expect(parseOrFail(schema, value)).toBe(value);
  });

  it.each([
    ['a wrong check digit', '4111111111111112'],
    ['a transposed pair of digits', '4111111111111211'],
    ['11 digits, too few', '79927398713'],
    ['20 digits, too many', '41111111111111111113'],
    ['two separators in a row', '4111  1111 1111 1111'],
    ['a leading separator', ' 4111111111111111'],
    ['a trailing separator', '4111111111111111-'],
    ['a letter', '4111 1111 1111 111a'],
    ['the empty string', ''],
  ])('rejects %s', (_name, value) => {
    expect(codeOf(schema, value)).toBe('s:isCreditCard');
  });

  it('does not put the number into expected or the message', () => {
    const issue = parse(schema, '4111111111111112')[0]![0]!;
    expect(issue.expected).toBe('valid card number');
    expect(issue.message).not.toContain('4111');
  });
});

describe('isJson', () => {
  const schema = string().custom(isJson());

  it.each([['{"a":[1,2]}'], ['[]'], ['42'], ['"text"'], ['true'], ['null'], [' {"a":1} ']])('accepts %p', (value) => {
    // The value stays the string it was.
    expect(parseOrFail(schema, value)).toBe(value);
  });

  it.each([
    ['', 'the empty string'],
    ["{'a':1}", 'single quotes'],
    ['{', 'an unclosed brace'],
    ['{"a":1,}', 'a trailing comma'],
    ['undefined', 'undefined'],
    ['NaN', 'NaN'],
  ])('rejects %p, %s', (value) => {
    expect(codeOf(schema, value)).toBe('s:isJson');
  });
});

describe('integer', () => {
  const schema = number().custom(integer());

  it.each([[0], [-5], [5.0], [1e21], [Number.MAX_SAFE_INTEGER], [-0]])('accepts %p', (value) => {
    expect(parseOrFail(schema, value)).toBe(value);
  });

  it.each([[1.5], [-0.1], [Number.EPSILON], [2.5e-10]])('rejects %p', (value) => {
    expect(codeOf(schema, value)).toBe('n:integer');
  });
});

describe('minKeys', () => {
  it('requires at least one of several optional properties', () => {
    const schema = object({ email: string().optional(), phone: string().optional() }).custom(minKeys(1));

    expect(parseOrFail(schema, { email: 'a@b.co' })).toEqual({ email: 'a@b.co' });
    expect(codeOf(schema, {})).toBe('o:minKeys');
  });

  it('counts the keys of a record', () => {
    const schema = record(string(), number()).custom(minKeys(2));

    expect(parseOrFail(schema, { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
    const issue = parse(schema, { a: 1 })[0]![0]!;
    expect(issue.code).toBe('o:minKeys');
    expect(issue.expected).toBe(2);
    expect(issue.received).toBe(1);
  });
});

// Found in review of 0.13.0.
describe('review fixes', () => {
  describe('minKeys', () => {
    const schema = object({ email: string().optional(), phone: string().optional() }).custom(minKeys(1));

    it('does not count a key whose value is undefined, which sends nothing', () => {
      // Form libraries and spreads fill absent fields with undefined; this used to pass with nothing sent.
      expect(codeOf(schema, { email: undefined, phone: undefined })).toBe('o:minKeys');
      expect(parseOrFail(schema, { email: undefined, phone: '+381641234567' })).toEqual({ phone: '+381641234567' });
    });

    it.each([[-1], [1.5], [NaN]])('refuses %p as a count when the schema is built', (count) => {
      expect(() => minKeys(count)).toThrow(BuildSchemaError);
      expect(() => maxKeys(count)).toThrow(BuildSchemaError);
      expect(() => minKeys(count)).toThrow('minKeys expects a non-negative integer');
    });

    it('refuses Infinity as a minimum, which no object can meet', () => {
      expect(() => minKeys(Infinity)).toThrow(BuildSchemaError);
    });

    it('takes Infinity as a maximum meaning no limit, and emits no keyword for it', () => {
      const schema = record(string(), number()).custom(maxKeys(Infinity));
      expect(parseOrFail(schema, { a: 1, b: 2 })).toEqual({ a: 1, b: 2 });
      expect(toJSONSchema(schema, { dialect: null })).not.toHaveProperty('maxProperties');
    });

    it('maxKeys does not count a key whose value is undefined either, as maxProperties would not', () => {
      const schema = object({ a: string().optional(), b: string().optional() }).custom(maxKeys(1));
      expect(parseOrFail(schema, { a: 'x', b: undefined })).toEqual({ a: 'x' });
    });

    it('counts what was sent: a property its default would fill in does not count', () => {
      // Same as minProperties, which a JSON Schema validator checks against the input.
      const schema = object({ role: string().default('user'), email: string().optional() }).custom(minKeys(1));
      expect(codeOf(schema, {})).toBe('o:minKeys');
      expect(parseOrFail(schema, { email: 'a@b.co' })).toEqual({ role: 'user', email: 'a@b.co' });
    });

    it('still takes 0', () => {
      expect(parseOrFail(object({}).custom(minKeys(0), maxKeys(0)), {})).toEqual({});
    });
  });

  describe('isCreditCard', () => {
    it.each([['000000000000'], ['0000 0000 0000 0000']])('rejects %p, which passes Luhn but is all zeros', (value) => {
      expect(codeOf(string().custom(isCreditCard()), value)).toBe('s:isCreditCard');
    });
  });

  describe('isAlpha and isAlphaNumeric', () => {
    it.each([
      ['a zero-width non-joiner inside a Persian word', 'می‌خواهم'],
      ['a zero-width joiner inside a Devanagari word', 'क्‍ष'],
    ])('accept %s', (_name, value) => {
      expect(parseOrFail(string().custom(isAlpha()), value)).toBe(value);
      expect(parseOrFail(string().custom(isAlphaNumeric()), value)).toBe(value);
    });

    it.each([
      ['a leading joiner', '‌ab'],
      ['a trailing joiner', 'ab‌'],
      ['a joiner before a digit', 'a‌1'],
    ])('reject %s', (_name, value) => {
      expect(codeOf(string().custom(isAlphaNumeric()), value)).toBe('s:isAlphaNumeric');
    });

    it('isAlphaNumeric does not let accents stack on a digit', () => {
      expect(codeOf(string().custom(isAlphaNumeric()), '1́')).toBe('s:isAlphaNumeric');
      expect(codeOf(string().custom(isAlphaNumeric()), '1' + '́'.repeat(20))).toBe('s:isAlphaNumeric');
      expect(parseOrFail(string().custom(isAlphaNumeric()), 'café')).toBe('café');
    });
  });
});
