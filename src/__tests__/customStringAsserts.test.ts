import { string } from '../asserts/string';
import { ValidationError } from '../exceptions';
import { lowerCase } from '../asserts/string/lowerCase';
import { atLeastOneUpperChar } from '../asserts/string/atLeastOneUpperChar';
import { atLeastOneLowerChar } from '../asserts/string/atLeastOneLowerChar';
import { atLeastOneSpecialChar } from '../asserts/string/atLeastOneSpecialChar';

import { atLeastOneDigit } from '../asserts/string/atLeastOneDigit';
import { upperCase } from '../asserts/string/upperCase';
import { uuid } from '../asserts/string/uuid';
import { uuidV1 } from '../asserts/string/uuidV1';
import { uuidV3 } from '../asserts/string/uuidV3';
import { uuidV4 } from '../asserts/string/uuidV4';
import { uuidV5 } from '../asserts/string/uuidV5';
import { uuidV2 } from '../asserts/string/uuidV2';
import { contains } from '../asserts/string/contains';
import { startsWith } from '../asserts/string/startsWith';
import { endsWith } from '../asserts/string/endsWith';
import { validUrl } from '../asserts/string/validUrl';
import { isValidDateTime } from '../asserts/string/isValidDateTime';
import { isValidDate } from '../asserts/string/isValidDate';
import { isValidTime } from '../asserts/string/isValidTime';
import { email } from '../asserts/string/email';
import { regExp } from '../asserts/string/regExp';
import { parse, parseOrFail } from '../core';
import { BuildSchemaError } from '../exceptions';

describe('Custom String Asserts', () => {
  it('should be all lower case', () => {
    const textSchema = string().custom(lowerCase());
    expect(parseOrFail(textSchema, 'valid')).toBe('valid');
    expect(parseOrFail(textSchema, '')).toBe('');
    expect(parseOrFail(textSchema, '1')).toBe('1');
    expect(() => parseOrFail(textSchema, 'InValid')).toThrow('The received value is not in lowercase');
    expect(() => parseOrFail(textSchema, 'I')).toThrow('The received value is not in lowercase');
    expect(() => parseOrFail(textSchema, 'I')).toThrow(ValidationError);
  });

  it('should be all upper case', () => {
    const textSchema = string().custom(upperCase());
    expect(parseOrFail(textSchema, 'VALID')).toBe('VALID');
    expect(parseOrFail(textSchema, '123')).toBe('123');
    expect(parseOrFail(textSchema, '')).toBe('');
    expect(() => parseOrFail(textSchema, 'Valid')).toThrow('The received value is not in uppercase');
    expect(() => parseOrFail(textSchema, 'valid')).toThrow('The received value is not in uppercase');
    expect(() => parseOrFail(textSchema, 'vAlid')).toThrow(ValidationError);
  });

  it('should be at least one digit', () => {
    const textSchema = string().custom(atLeastOneDigit());
    expect(parseOrFail(textSchema, 'abc123')).toBe('abc123');
    expect(parseOrFail(textSchema, '1')).toBe('1');
    expect(() => parseOrFail(textSchema, 'abcdef')).toThrow('The received value does not contain at least one digit');
    expect(() => parseOrFail(textSchema, '')).toThrow('The received value does not contain at least one digit');
    expect(() => parseOrFail(textSchema, '')).toThrow(ValidationError);
  });

  it('should contain at least one lowercase character', () => {
    const textSchema = string().custom(atLeastOneLowerChar());
    expect(parseOrFail(textSchema, 'abc123')).toBe('abc123');
    expect(parseOrFail(textSchema, 'A1b2C3')).toBe('A1b2C3');
    expect(() => parseOrFail(textSchema, 'ABC123')).toThrow(
      'The received value does not contain at least one lowercase character',
    );
    expect(() => parseOrFail(textSchema, '123')).toThrow(
      'The received value does not contain at least one lowercase character',
    );
    expect(() => parseOrFail(textSchema, '')).toThrow(ValidationError);
  });

  it('should contain at least one uppercase character', () => {
    const textSchema = string().custom(atLeastOneUpperChar());
    expect(parseOrFail(textSchema, 'ABC123')).toBe('ABC123');
    expect(parseOrFail(textSchema, 'a1B2c3')).toBe('a1B2c3');
    expect(() => parseOrFail(textSchema, 'abc123')).toThrow(
      'The received value does not contain at least one uppercase character',
    );
    expect(() => parseOrFail(textSchema, '123')).toThrow(
      'The received value does not contain at least one uppercase character',
    );
    expect(() => parseOrFail(textSchema, '')).toThrow(ValidationError);
  });

  it('should contain at least one special character', () => {
    const textSchema = string().custom(atLeastOneSpecialChar());
    expect(parseOrFail(textSchema, 'abc123!')).toBe('abc123!');
    expect(parseOrFail(textSchema, '@abc123')).toBe('@abc123');
    expect(parseOrFail(textSchema, '@#$%^abc123')).toBe('@#$%^abc123');
    expect(() => parseOrFail(textSchema, 'abc123')).toThrow(
      'The received value does not contain at least one special character',
    );
    expect(() => parseOrFail(textSchema, '123')).toThrow(
      'The received value does not contain at least one special character',
    );
    expect(() => parseOrFail(textSchema, '')).toThrow(ValidationError);
  });

  it('should contain at least one custom special character (@ or $)', () => {
    const customSpecialCharSchema = string().custom(atLeastOneSpecialChar('@$'));
    expect(parseOrFail(customSpecialCharSchema, 'abc@123')).toBe('abc@123');
    expect(parseOrFail(customSpecialCharSchema, '$abc123')).toBe('$abc123');
    expect(parseOrFail(customSpecialCharSchema, '@withOptionalSpecChar&')).toBe('@withOptionalSpecChar&');
    expect(() => parseOrFail(customSpecialCharSchema, 'abc123!')).toThrow(
      'The received value does not contain at least one special character',
    );
    expect(() => parseOrFail(customSpecialCharSchema, '123')).toThrow(
      'The received value does not contain at least one special character',
    );
    expect(() => parseOrFail(customSpecialCharSchema, '')).toThrow(ValidationError);
  });

  it('should be a valid UUID', () => {
    const textSchema = string().custom(uuid());
    const defaultErrorMessage = 'The received value is not a valid UUID';
    expect(parseOrFail(textSchema, '123e4567-e89b-12d3-a456-426614174000')).toBe(
      '123e4567-e89b-12d3-a456-426614174000',
    );
    expect(parseOrFail(textSchema, '1b4e28ba-2fa1-11d2-883f-0016d3cca427')).toBe(
      '1b4e28ba-2fa1-11d2-883f-0016d3cca427',
    );

    expect(() => parseOrFail(textSchema, 'invalid-uuid')).toThrow(defaultErrorMessage);
    expect(() => parseOrFail(textSchema, '123e4567-e89b-12d3-a456-42661417400X')).toThrow(defaultErrorMessage);
    expect(() => parseOrFail(textSchema, '1b4r28ba-2fa1-10d2-883f-0016d3cca427')).toThrow(defaultErrorMessage);
    expect(() => parseOrFail(textSchema, '')).toThrow(defaultErrorMessage);
    expect(() => parseOrFail(textSchema, '123e4567-e89b-12d3-a456-42661417400')).toThrow(ValidationError);
  });

  it('should be a valid UUID v1', () => {
    const textSchema = string().custom(uuidV1());
    expect(parseOrFail(textSchema, '550e8400-e29b-11d4-a716-446655440000')).toBe(
      '550e8400-e29b-11d4-a716-446655440000',
    );
    expect(() => parseOrFail(textSchema, 'invalid-uuid')).toThrow('The received value is not a valid UUID v1');
    expect(() => parseOrFail(textSchema, '123e4567-e89b-22d3-a456-426614174000')).toThrow(ValidationError);
  });

  it('should be a valid UUID v2', () => {
    const textSchema = string().custom(uuidV2());
    expect(parseOrFail(textSchema, '550e8400-e29b-21d4-a716-446655440000')).toBe(
      '550e8400-e29b-21d4-a716-446655440000',
    );
    expect(() => parseOrFail(textSchema, 'invalid-uuid')).toThrow('The received value is not a valid UUID v2');
    expect(() => parseOrFail(textSchema, '123e4567-e89b-12d3-a456-426614174000')).toThrow(ValidationError);
  });

  it('should be a valid UUID v3', () => {
    const textSchema = string().custom(uuidV3());
    expect(parseOrFail(textSchema, '550e8400-e29b-38d1-a456-426614174000')).toBe(
      '550e8400-e29b-38d1-a456-426614174000',
    );
    expect(() => parseOrFail(textSchema, 'invalid-uuid')).toThrow('The received value is not a valid UUID v3');
    expect(() => parseOrFail(textSchema, '123e4567-e89b-12d3-a456-426614174000')).toThrow(ValidationError);
  });

  it('should be a valid UUID v4', () => {
    const textSchema = string().custom(uuidV4());
    expect(parseOrFail(textSchema, '123e4567-e89b-42d3-a456-426614174000')).toBe(
      '123e4567-e89b-42d3-a456-426614174000',
    );
    expect(() => parseOrFail(textSchema, 'invalid-uuid')).toThrow('The received value is not a valid UUID v4');
    expect(() => parseOrFail(textSchema, '123e4567-e89b-12d3-a456-426614174000')).toThrow(
      'The received value is not a valid UUID v4',
    );
    expect(() => parseOrFail(textSchema, '123e4567-e89b-a2d3-a456-426614174000')).toThrow(
      'The received value is not a valid UUID v4',
    );
    expect(() => parseOrFail(textSchema, '123e4567-e89b-42d3-c456-426614174000')).toThrow(
      'The received value is not a valid UUID v4',
    );
    expect(() => parseOrFail(textSchema, '550e8400-e29b-31d4-a716-446655440000')).toThrow(ValidationError);
  });

  it('should be a valid UUID v5', () => {
    const textSchema = string().custom(uuidV5());
    expect(parseOrFail(textSchema, '550e8400-e29b-51d4-a716-446655440000')).toBe(
      '550e8400-e29b-51d4-a716-446655440000',
    );
    expect(() => parseOrFail(textSchema, 'invalid-uuid')).toThrow('The received value is not a valid UUID v5');
    expect(() => parseOrFail(textSchema, '123e4567-e89b-12d3-a456-426614174000')).toThrow(ValidationError);
  });

  it('should contain the specified substring', () => {
    const textSchema = string().custom(contains('foo'));
    expect(parseOrFail(textSchema, 'foobar')).toBe('foobar');
    expect(parseOrFail(textSchema, 'foo')).toBe('foo');
    expect(() => parseOrFail(textSchema, 'bar')).toThrow('The received value does not contain the required substring');
    expect(() => parseOrFail(textSchema, '')).toThrow('The received value does not contain the required substring');
    expect(() => parseOrFail(textSchema, '')).toThrow(ValidationError);
  });

  it('should start with the specified substring', () => {
    const textSchema = string().custom(startsWith('foo'));
    expect(parseOrFail(textSchema, 'foobar')).toBe('foobar');
    expect(parseOrFail(textSchema, 'foo')).toBe('foo');
    expect(() => parseOrFail(textSchema, 'barfoo')).toThrow(
      'The received value does not start with the required substring',
    );
    expect(() => parseOrFail(textSchema, '')).toThrow('The received value does not start with the required substring');
    expect(() => parseOrFail(textSchema, '')).toThrow(ValidationError);
  });

  it('should end with the specified substring', () => {
    const textSchema = string().custom(endsWith('bar'));
    expect(parseOrFail(textSchema, 'foobar')).toBe('foobar');
    expect(parseOrFail(textSchema, 'bar')).toBe('bar');
    expect(() => parseOrFail(textSchema, 'foofoo')).toThrow(
      'The received value does not end with the required substring',
    );
    expect(() => parseOrFail(textSchema, 'ar')).toThrow('The received value does not end with the required substring');
    expect(() => parseOrFail(textSchema, '')).toThrow('The received value does not end with the required substring');
    expect(() => parseOrFail(textSchema, '')).toThrow(ValidationError);
  });

  describe('isValidURL', () => {
    it('should be a valid URL', () => {
      const textSchema = string().custom(validUrl());
      // Valid cases
      expect(parseOrFail(textSchema, 'http://example.com/')).toBe('http://example.com/');
      expect(parseOrFail(textSchema, 'https://example.com/')).toBe('https://example.com/');
      expect(parseOrFail(textSchema, 'http://example.com')).toBe('http://example.com');
      expect(parseOrFail(textSchema, 'https://example.com')).toBe('https://example.com');
      expect(parseOrFail(textSchema, 'http://example.com/path/to/resource.html')).toBe(
        'http://example.com/path/to/resource.html',
      );
      expect(parseOrFail(textSchema, 'http://example.com/?query=param')).toBe('http://example.com/?query=param');
      expect(parseOrFail(textSchema, 'http://example.com:3000/resource.html')).toBe(
        'http://example.com:3000/resource.html',
      );
      expect(parseOrFail(textSchema, 'http://example.com/space%20encoding.html')).toBe(
        'http://example.com/space%20encoding.html',
      );
      expect(parseOrFail(textSchema, 'https://example.com/path/to/resource.html')).toBe(
        'https://example.com/path/to/resource.html',
      );
      expect(parseOrFail(textSchema, 'https://example.com/?query=param')).toBe('https://example.com/?query=param');
      expect(parseOrFail(textSchema, 'https://example.com:3000/resource.html')).toBe(
        'https://example.com:3000/resource.html',
      );
      expect(parseOrFail(textSchema, 'https://example.com/space%20encoding.html')).toBe(
        'https://example.com/space%20encoding.html',
      );
      expect(parseOrFail(textSchema, 'http://10.0.0.1/')).toBe('http://10.0.0.1/');

      // Invalid cases
      expect(() => parseOrFail(textSchema, '')).toThrow('The received value is not a valid URL');
      expect(() => parseOrFail(textSchema, 'ftp://example.com')).toThrow('The received value is not a valid URL');
      expect(() => parseOrFail(textSchema, 'http:example.com')).toThrow('The received value is not a valid URL');
    });

    it('should be a valid URL with specified protocol', () => {
      const textSchema = string().custom(validUrl('http'));
      // Valid cases
      expect(parseOrFail(textSchema, 'http://example.com/')).toBe('http://example.com/');
      expect(parseOrFail(textSchema, 'http://example.com')).toBe('http://example.com');
      expect(parseOrFail(textSchema, 'http://example.com/path/to/resource.html')).toBe(
        'http://example.com/path/to/resource.html',
      );
      expect(parseOrFail(textSchema, 'http://example.com/?query=param')).toBe('http://example.com/?query=param');
      expect(parseOrFail(textSchema, 'http://example.com:3000/resource.html')).toBe(
        'http://example.com:3000/resource.html',
      );
      expect(parseOrFail(textSchema, 'http://example.com/space%20encoding.html')).toBe(
        'http://example.com/space%20encoding.html',
      );
      expect(parseOrFail(textSchema, 'http://10.0.0.1/')).toBe('http://10.0.0.1/');

      // Invalid cases
      expect(() => parseOrFail(textSchema, 'https://example.com')).toThrow('The received value is not a valid URL');
      expect(() => parseOrFail(textSchema, 'ftp://example.com')).toThrow('The received value is not a valid URL');
      expect(() => parseOrFail(textSchema, 'http:example.com')).toThrow('The received value is not a valid URL');
      expect(() => parseOrFail(textSchema, '')).toThrow('The received value is not a valid URL');
    });

    it.each([
      ['a host of only dots', 'http://...'],
      ['a host of only a hyphen', 'http://-'],
      ['a label starting with a hyphen', 'http://-a.com'],
      ['a label ending with a hyphen', 'http://a-.com'],
      ['an empty label', 'http://a..com'],
      ['a port above 65535', 'http://a.com:65536'],
      ['a port of six digits', 'http://a.com:100000'],
      ['whitespace in the path', 'http://a.com/a b'],
    ])('rejects %s', (_name, value) => {
      expect(() => parseOrFail(string().custom(validUrl()), value)).toThrow('The received value is not a valid URL');
    });

    it.each([
      ['a query with no path', 'http://a.com?x=1'],
      ['a fragment with no path', 'https://a.com#top'],
      ['the highest port', 'http://a.com:65535'],
      ['a hyphen inside a label', 'https://my-site.example.com/'],
      ['a fully qualified name', 'http://example.com./'],
      ['a single label', 'http://localhost:3000/'],
    ])('accepts %s', (_name, value) => {
      expect(parseOrFail(string().custom(validUrl()), value)).toBe(value);
    });

    it('matches the protocol literally rather than as a regex', () => {
      // It was spliced into the regex unescaped, so the `.` in `a.b` matched any character.
      const schema = string().custom(validUrl('a.b'));
      expect(parseOrFail(schema, 'a.b://host')).toBe('a.b://host');
      expect(() => parseOrFail(schema, 'axb://host')).toThrow('The received value is not a valid URL');

      const plus = string().custom(validUrl('git+ssh'));
      expect(parseOrFail(plus, 'git+ssh://host')).toBe('git+ssh://host');
      expect(() => parseOrFail(plus, 'gitssh://host')).toThrow('The received value is not a valid URL');
    });
  });

  describe('email', () => {
    it.each([
      ['whitespace in the local part', 'a b@c.d'],
      ['a line break', 'a\n@b.c'],
      ['a tab', 'a@b\t.c'],
      ['two dots in the domain', 'a@b..c'],
      ['two dots in the local part', 'a..b@c.d'],
      ['a leading dot', '.a@b.c'],
      ['a trailing dot in the local part', 'a.@b.c'],
      ['a trailing dot in the domain', 'a@b.c.'],
      ['a leading dot in the domain', 'a@.b.c'],
      ['two @ signs', 'a@b@c.d'],
      ['no dot in the domain', 'a@b'],
    ])('rejects %s', (_name, value) => {
      expect(() => parseOrFail(string().custom(email()), value)).toThrow(
        'The received value does not match the required email pattern',
      );
    });

    it.each([['a@b.c'], ['first.last+tag@sub.example.co.uk'], ['ünïcødé@example.com']])('accepts %s', (value) => {
      expect(parseOrFail(string().custom(email()), value)).toBe(value);
    });
  });

  describe('regExp', () => {
    it.each([['g'], ['y'], ['gy']])('gives the same answer on every parse with the %s flag', (flags) => {
      // `test` on a global or sticky regex resumes from `lastIndex`, so the same value used to pass and
      // fail on alternate parses.
      const schema = string().custom(regExp(new RegExp('a', flags)));
      const results = [1, 2, 3, 4].map(() => parse(schema, 'a')[0] === null);
      expect(results).toEqual([true, true, true, true]);
    });

    it("leaves the caller's regex untouched", () => {
      const pattern = /a/g;
      pattern.lastIndex = 5;
      parse(string().custom(regExp(pattern)), 'a');
      expect(pattern.lastIndex).toBe(5);
    });

    it('keeps the meaning of the sticky flag', () => {
      // Sticky anchors the match at the start, which a rewound copy still does.
      const schema = string().custom(regExp(/a/y));
      expect(() => parseOrFail(schema, 'ba')).toThrow('The received value does not match the required text pattern');
    });
  });

  describe('isValidDateTime', () => {
    it('should pass for valid ISO 8601 datetime strings without offset', () => {
      const schema = string().custom(isValidDateTime());

      expect(() => parseOrFail(schema, '2024-01-01T00:00:00Z')).not.toThrow();
      expect(() => parseOrFail(schema, '2024-01-01T00:00:00.250Z')).not.toThrow();
      expect(() => parseOrFail(schema, '2024-01-01T00:00:00.250816Z')).not.toThrow();
      expect(() => parseOrFail(schema, '2024-01-01T00:00:00+03:00')).toThrow(ValidationError);
    });

    it('should pass for valid ISO 8601 datetime strings with offset', () => {
      const schema = string().custom(isValidDateTime({ offset: true }));

      expect(() => parseOrFail(schema, '2024-01-01T00:00:00+03:00')).not.toThrow();
      expect(() => parseOrFail(schema, '2024-01-01T00:00:00.123+03:00')).not.toThrow();
      expect(() => parseOrFail(schema, '2024-01-01T00:00:00.123+0300')).not.toThrow();
      expect(() => parseOrFail(schema, '2024-01-01T00:00:00.123+03')).not.toThrow();
      expect(() => parseOrFail(schema, '2024-01-01T00:00:00Z')).not.toThrow();
    });

    it('should pass for valid ISO 8601 datetime strings with specific precision', () => {
      const schema = string().custom(isValidDateTime({ precision: 3 }));

      expect(() => parseOrFail(schema, '2024-01-01T00:00:00.250Z')).not.toThrow();
      expect(() => parseOrFail(schema, '2024-01-01T00:00:00Z')).toThrow(ValidationError);
      expect(() => parseOrFail(schema, '2024-01-01T00:00:00.250816Z')).toThrow(ValidationError);
    });

    // From the report in #21, plus the neighbouring cases. Each part used to be any two digits.
    it.each([
      ['a February 29th outside a leap year', '2021-02-29T00:00:00Z'],
      ['a February 29th in a century that is not a leap year', '1900-02-29T00:00:00Z'],
      ['an April 31st', '2020-04-31T00:00:00Z'],
      ['month 00', '2020-00-01T00:00:00Z'],
      ['month 13', '2020-13-01T00:00:00Z'],
      ['day 00', '2020-01-00T00:00:00Z'],
      ['hour 24', '2020-01-01T24:00:00Z'],
      ['hour 25', '2020-01-01T25:00:00Z'],
      ['minute 60', '2020-01-01T23:60:00Z'],
      ['second 60, a leap second a Date cannot hold', '2016-12-31T23:59:60Z'],
      ['every part out of range', '9999-99-99T99:99:99Z'],
      ['a bare dot for a fraction', '2020-01-01T00:00:00.Z'],
    ])('rejects %s', (_name, value) => {
      expect(() => parseOrFail(string().custom(isValidDateTime()), value)).toThrow(
        'The received value is not a valid ISO 8601 datetime string',
      );
    });

    it.each([
      ['a February 29th in a leap year', '2020-02-29T00:00:00Z'],
      ['a February 29th in a 400th year', '2000-02-29T00:00:00Z'],
      ['the last moment of a day', '2020-12-31T23:59:59.999Z'],
      ['a year before 1900', '1800-01-01T00:00:00Z'],
      ['a year after 2099', '2100-01-01T00:00:00Z'],
      ['year 0000', '0000-01-01T00:00:00Z'],
    ])('accepts %s', (_name, value) => {
      expect(parseOrFail(string().custom(isValidDateTime()), value)).toBe(value);
    });

    it.each([
      ['hours 25', '2020-01-01T00:00:00+25:00'],
      ['minutes 60', '2020-01-01T00:00:00+23:60'],
      ['both out of range', '2020-01-01T00:00:00+25:60'],
      ['hours 24 in the HHMM form', '2020-01-01T00:00:00-2400'],
      ['hours 24 in the HH form', '2020-01-01T00:00:00+24'],
      ['three digits', '2020-01-01T00:00:00+030'],
    ])('rejects an offset with %s', (_name, value) => {
      expect(() => parseOrFail(string().custom(isValidDateTime({ offset: true })), value)).toThrow(
        'The received value is not a valid ISO 8601 datetime string',
      );
    });

    it.each([['+23:59'], ['-23:59'], ['-00:00'], ['+2359'], ['+23']])('accepts the offset %s', (offset) => {
      const value = `2020-01-01T00:00:00${offset}`;
      expect(parseOrFail(string().custom(isValidDateTime({ offset: true })), value)).toBe(value);
    });

    it('forbids a fraction when the precision is 0', () => {
      const schema = string().custom(isValidDateTime({ precision: 0 }));
      expect(parseOrFail(schema, '2020-01-01T00:00:00Z')).toBe('2020-01-01T00:00:00Z');
      expect(() => parseOrFail(schema, '2020-01-01T00:00:00.Z')).toThrow(ValidationError);
      expect(() => parseOrFail(schema, '2020-01-01T00:00:00.1Z')).toThrow(ValidationError);
    });

    it.each([[-1], [1.5], [NaN], [Infinity]])('refuses the precision %s when the schema is built', (precision) => {
      expect(() => isValidDateTime({ precision })).toThrow(BuildSchemaError);
      expect(() => isValidDateTime({ precision })).toThrow('precision must be a non-negative integer');
    });
  });

  describe('isValidDate', () => {
    it('should pass for valid date strings in YYYY-MM-DD format', () => {
      const schema = string().custom(isValidDate());

      expect(() => parseOrFail(schema, '2024-01-01')).not.toThrow(); // valid
    });

    it('should fail for date strings not in YYYY-MM-DD format', () => {
      const schema = string().custom(isValidDate());

      expect(() => parseOrFail(schema, '2024-1-1')).toThrow(); // invalid (single digit month and day)
      expect(() => parseOrFail(schema, '2024-01-32')).toThrow(); // invalid (day out of range)
      expect(() => parseOrFail(schema, '2024-13-01')).toThrow(); // invalid (month out of range)
      expect(() => parseOrFail(schema, '20-01-01')).toThrow(); // invalid (year too short)
      expect(() => parseOrFail(schema, '2024/01/01')).toThrow(); // invalid (wrong delimiter)
    });

    // From the report in #21. The day was checked against 01–31 whatever the month.
    it.each([
      ['a February 29th outside a leap year', '2021-02-29'],
      ['a February 29th in a century that is not a leap year', '1900-02-29'],
      ['a February 30th', '2020-02-30'],
      ['an April 31st', '2020-04-31'],
      ['a June 31st', '2020-06-31'],
      ['a September 31st', '2020-09-31'],
      ['a November 31st', '2020-11-31'],
      ['day 00', '2020-01-00'],
      ['month 00', '2020-00-01'],
      ['a five-digit year', '10000-01-01'],
    ])('rejects %s', (_name, value) => {
      expect(() => parseOrFail(string().custom(isValidDate()), value)).toThrow(
        'The received value is not a valid date',
      );
    });

    // The year was limited to 1900–2099, which RFC 3339 does not do.
    it.each([
      ['a February 29th in a leap year', '2020-02-29'],
      ['a February 29th in a 400th year', '2000-02-29'],
      ['a December 31st', '2020-12-31'],
      ['the last day of a 30-day month', '2020-04-30'],
      ['a February 28th outside a leap year', '2021-02-28'],
      ['a year before 1900', '1800-01-01'],
      ['a year after 2099', '2100-01-01'],
      ['year 0000', '0000-01-01'],
      ['year 9999', '9999-12-31'],
    ])('accepts %s', (_name, value) => {
      expect(parseOrFail(string().custom(isValidDate()), value)).toBe(value);
    });
  });

  describe('isValidTime', () => {
    it('should pass for valid time strings in HH:mm:ss format', () => {
      const schema = string().custom(isValidTime());

      expect(() => parseOrFail(schema, '00:00:00')).not.toThrow(); // valid
      expect(() => parseOrFail(schema, '09:52:31')).not.toThrow(); // valid
      expect(() => parseOrFail(schema, '23:59:59.9999999')).not.toThrow(); // valid with arbitrary precision
    });

    it('should fail for time strings with offsets or Z suffix', () => {
      const schema = string().custom(isValidTime());

      expect(() => parseOrFail(schema, '00:00:00.123Z')).toThrow(); // invalid (Z not allowed)
      expect(() => parseOrFail(schema, '00:00:00.123+02:00')).toThrow(); // invalid (offsets not allowed)
      expect(() => parseOrFail(schema, '00:00:00.123-02:00')).toThrow(); // invalid (offsets not allowed)
    });

    it('should enforce precision when specified', () => {
      const schema = string().custom(isValidTime({ precision: 3 }));

      expect(() => parseOrFail(schema, '00:00:00.123')).not.toThrow(); // valid with specified precision
      expect(() => parseOrFail(schema, '00:00:00')).toThrow(); // invalid (precision required)
      expect(() => parseOrFail(schema, '00:00:00.250816')).toThrow(); // invalid (too many fractional digits)
    });

    it('should fail if precision is specified but the time string does not include milliseconds', () => {
      const schema = string().custom(isValidTime({ precision: 3 }));

      expect(() => parseOrFail(schema, '12:34:56Z')).toThrow(); // Should throw error as 'Z' is not allowed
      expect(() => parseOrFail(schema, '00:00:00')).toThrow(); // invalid (missing milliseconds)
      expect(() => parseOrFail(schema, '00:00:00.12')).toThrow(); // invalid (not enough precision)
    });

    it('should fail if time string contains Z, +, or -', () => {
      const schema = string().custom(isValidTime());

      expect(() => parseOrFail(schema, '12:34:56Z')).toThrow(); // Should throw error as 'Z' is not allowed
      expect(() => parseOrFail(schema, '12:34:56+02:00')).toThrow(); // Should throw error as '+' is not allowed
      expect(() => parseOrFail(schema, '12:34:56-02:00')).toThrow(); // Should throw error as '-' is not allowed
    });

    it('should pass if time string does not contain Z, +, or -', () => {
      const schema = string().custom(isValidTime());

      expect(() => parseOrFail(schema, '12:34:56')).not.toThrow(); // Valid time
      expect(() => parseOrFail(schema, '23:59:59.999')).not.toThrow(); // Valid time with milliseconds
    });

    it('reports one issue, not two, for a malformed value when a precision is set', () => {
      // A second check for the dot used to add a duplicate issue under getAllErrors.
      const [errors] = parse(string().custom(isValidTime({ precision: 3 })), 'xx', { getAllErrors: true });
      expect(errors).toHaveLength(1);
    });

    it('forbids a fraction when the precision is 0', () => {
      const schema = string().custom(isValidTime({ precision: 0 }));
      expect(parseOrFail(schema, '12:00:00')).toBe('12:00:00');
      expect(() => parseOrFail(schema, '12:00:00.')).toThrow('The received value is not a valid time');
      expect(() => parseOrFail(schema, '12:00:00.1')).toThrow('The received value is not a valid time');
    });

    it.each([['24:00:00'], ['23:60:00'], ['23:59:60'], ['12:00:00.']])('rejects %s', (value) => {
      expect(() => parseOrFail(string().custom(isValidTime()), value)).toThrow(
        'The received value is not a valid time',
      );
    });

    it.each([[-1], [2.5]])('refuses the precision %s when the schema is built', (precision) => {
      expect(() => isValidTime({ precision })).toThrow(BuildSchemaError);
    });
  });
});
