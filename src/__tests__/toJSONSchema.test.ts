import { toJSONSchema, BuildSchemaError } from '../';
import { CommonSchema } from '../core';
import { array } from '../asserts/array';
import { bigint } from '../asserts/bigint';
import { boolean } from '../asserts/boolean';
import { date } from '../asserts/date';
import { lazy } from '../asserts/lazy';
import { number } from '../asserts/number';
import { object } from '../asserts/object';
import { oneOfTypes } from '../asserts/mix';
import { record } from '../asserts/record';
import { string } from '../asserts/string';
import { tuple } from '../asserts/tuple';
import { union } from '../asserts/union';
import { email } from '../asserts/string/email';
import { isValidDate } from '../asserts/string/isValidDate';
import { isValidDateTime } from '../asserts/string/isValidDateTime';
import { isValidTime } from '../asserts/string/isValidTime';
import { maxLength } from '../asserts/string/maxLength';
import { minLength } from '../asserts/string/minLength';
import { regExp } from '../asserts/string/regExp';
import { uuid } from '../asserts/string/uuid';
import { validUrl } from '../asserts/string/validUrl';
import { max } from '../asserts/number/max';
import { maxExcluded } from '../asserts/number/maxExcluded';
import { min } from '../asserts/number/min';
import { minExcluded } from '../asserts/number/minExcluded';
import { negative } from '../asserts/number/negative';
import { positive } from '../asserts/number/positive';
import { maxArrayLength } from '../asserts/array/maxArrayLength';
import { minArrayLength } from '../asserts/array/minArrayLength';
import { maxKeys } from '../asserts/object/maxKeys';
import { contains } from '../asserts/string/contains';

/** Most cases read better without the dialect line, which is asserted separately. */
const bare = (schema: CommonSchema) => toJSONSchema(schema, { dialect: null });

/**
 * The output is only worth anything if a JSON Schema validator reads it the same way bguard does. That
 * agreement is checked against ajv outside the suite; these tests pin the shape, and in particular the
 * places where the mapping had to make a decision.
 */
describe('toJSONSchema', () => {
  describe('primitives', () => {
    it.each([
      ['string', string(), 'string'],
      ['number', number(), 'number'],
      ['boolean', boolean(), 'boolean'],
    ])('maps %s', (_name, schema, expected) => {
      expect(bare(schema)).toEqual({ type: expected });
    });

    it('maps a date to a formatted string, since JSON has no date type', () => {
      expect(bare(date())).toEqual({ type: 'string', format: 'date-time' });
    });

    it('lists several types for oneOfTypes', () => {
      expect(bare(oneOfTypes(['string', 'number']))).toEqual({ type: ['string', 'number'] });
    });

    it('emits nothing for a type list that names only undefined', () => {
      expect(bare(oneOfTypes(['undefined']))).toEqual({});
    });

    it('refuses a type with no JSON Schema counterpart rather than approximating it', () => {
      // A bigint is not representable in JSON at all, so emitting `integer` would be a lie.
      expect(() => bare(bigint())).toThrow(BuildSchemaError);
      expect(() => bare(bigint())).toThrow("Type 'bigint' has no JSON Schema equivalent");
    });
  });

  describe('assertions that map onto a keyword', () => {
    it.each([
      ['minLength', string().custom(minLength(2)), { type: 'string', minLength: 2 }],
      ['maxLength', string().custom(maxLength(9)), { type: 'string', maxLength: 9 }],
      ['regExp', string().custom(regExp(/^a.c$/)), { type: 'string', pattern: '^a.c$' }],
      ['email', string().custom(email()), { type: 'string', format: 'email' }],
      ['validUrl', string().custom(validUrl()), { type: 'string', format: 'uri' }],
      ['uuid', string().custom(uuid()), { type: 'string', format: 'uuid' }],
      ['isValidDate', string().custom(isValidDate()), { type: 'string', format: 'date' }],
      ['isValidDateTime', string().custom(isValidDateTime()), { type: 'string', format: 'date-time' }],
      ['isValidTime', string().custom(isValidTime()), { type: 'string', format: 'time' }],
      ['min', number().custom(min(1)), { type: 'number', minimum: 1 }],
      ['max', number().custom(max(9)), { type: 'number', maximum: 9 }],
      ['minExcluded', number().custom(minExcluded(1)), { type: 'number', exclusiveMinimum: 1 }],
      ['maxExcluded', number().custom(maxExcluded(9)), { type: 'number', exclusiveMaximum: 9 }],
      ['positive', number().custom(positive()), { type: 'number', exclusiveMinimum: 0 }],
      ['negative', number().custom(negative()), { type: 'number', exclusiveMaximum: 0 }],
      [
        'minArrayLength',
        array(string()).custom(minArrayLength(2)),
        {
          type: 'array',
          items: { type: 'string' },
          minItems: 2,
        },
      ],
      [
        'maxArrayLength',
        array(string()).custom(maxArrayLength(2)),
        {
          type: 'array',
          items: { type: 'string' },
          maxItems: 2,
        },
      ],
      [
        'maxKeys',
        object({ a: string() }).custom(maxKeys(1)),
        {
          type: 'object',
          properties: { a: { type: 'string' } },
          required: ['a'],
          additionalProperties: false,
          maxProperties: 1,
        },
      ],
    ])('carries %s', (_name, schema, expected) => {
      expect(bare(schema)).toEqual(expected);
    });

    it('combines several on one schema', () => {
      expect(bare(string().custom(minLength(2), maxLength(9)))).toEqual({
        type: 'string',
        minLength: 2,
        maxLength: 9,
      });
    });

    it('leaves out an assertion with no equivalent', () => {
      // JSON Schema has no "contains this substring" keyword, so it is absent rather than approximated.
      expect(bare(string().custom(contains('x')))).toEqual({ type: 'string' });
    });
  });

  describe('literals', () => {
    it('maps equalTo to const, without a redundant type', () => {
      expect(bare(string().equalTo('yes'))).toEqual({ const: 'yes' });
      expect(bare(number().equalTo(5))).toEqual({ const: 5 });
    });

    it('maps oneOfValues to enum', () => {
      expect(bare(string().oneOfValues(['en', 'sr']))).toEqual({ enum: ['en', 'sr'] });
      expect(bare(number().oneOfValues([1, 2]))).toEqual({ enum: [1, 2] });
    });

    it('unquotes a string literal, which codeGen had wrapped for TypeScript', () => {
      expect(bare(string().equalTo("it's"))).toEqual({ const: "it's" });
      expect(bare(string().equalTo('back\\slash'))).toEqual({ const: 'back\\slash' });
    });

    it('maps a boolean restriction to const', () => {
      expect(bare(boolean().onlyTrue())).toEqual({ const: true });
    });
  });

  describe('objects', () => {
    it('lists properties and which are required', () => {
      expect(bare(object({ a: string(), b: number().optional() }))).toEqual({
        type: 'object',
        properties: { a: { type: 'string' }, b: { type: 'number' } },
        required: ['a'],
        additionalProperties: false,
      });
    });

    it('treats a defaulted property as not required, and records the default', () => {
      // The caller need not send it, which is the same rule InferInput follows.
      expect(bare(object({ p: number().default(1), q: string() }))).toEqual({
        type: 'object',
        properties: { p: { type: 'number', default: 1 }, q: { type: 'string' } },
        required: ['q'],
        additionalProperties: false,
      });
    });

    it('omits required entirely when nothing is', () => {
      expect(bare(object({ a: string().optional() }))).toEqual({
        type: 'object',
        properties: { a: { type: 'string' } },
        additionalProperties: false,
      });
    });

    it('drops additionalProperties: false under allowUnrecognized', () => {
      expect(bare(object({ a: string() }).allowUnrecognized())).toEqual({
        type: 'object',
        properties: { a: { type: 'string' } },
        required: ['a'],
      });
    });

    it('nests', () => {
      expect(bare(object({ u: object({ n: string() }) }))).toEqual({
        type: 'object',
        properties: {
          u: { type: 'object', properties: { n: { type: 'string' } }, required: ['n'], additionalProperties: false },
        },
        required: ['u'],
        additionalProperties: false,
      });
    });
  });

  describe('containers', () => {
    it('maps an array to items', () => {
      expect(bare(array(string()))).toEqual({ type: 'array', items: { type: 'string' } });
    });

    it('maps a union to anyOf', () => {
      expect(bare(union([string(), number()]))).toEqual({ anyOf: [{ type: 'string' }, { type: 'number' }] });
    });

    it('maps a tuple to prefixItems with the extras forbidden', () => {
      // Without `items: false` and the bounds it would be an array that merely starts a certain way.
      expect(bare(tuple([string(), number()]))).toEqual({
        type: 'array',
        prefixItems: [{ type: 'string' }, { type: 'number' }],
        items: false,
        minItems: 2,
        maxItems: 2,
      });
    });

    it('maps a record to additionalProperties', () => {
      expect(bare(record(string(), number()))).toEqual({ type: 'object', additionalProperties: { type: 'number' } });
    });

    it('maps a record with a restricted key set to named properties, none required', () => {
      // Validation checks the keys that are present rather than demanding the whole set, which is why
      // InferType says Partial and why there is no `required` here.
      expect(bare(record(string().oneOfValues(['en', 'sr']), string()))).toEqual({
        type: 'object',
        properties: { en: { type: 'string' }, sr: { type: 'string' } },
        additionalProperties: false,
      });
    });
  });

  describe('nullability', () => {
    it('adds null to a single type', () => {
      expect(bare(string().nullable())).toEqual({ type: ['string', 'null'] });
    });

    it('adds null to a list of types', () => {
      expect(bare(oneOfTypes(['string', 'number']).nullable())).toEqual({ type: ['string', 'number', 'null'] });
    });

    it('wraps a union rather than merging, since anyOf takes no sibling type', () => {
      expect(bare(union([string(), number()]).nullable())).toEqual({
        anyOf: [{ anyOf: [{ type: 'string' }, { type: 'number' }] }, { type: 'null' }],
      });
    });

    it('wraps a literal, which has no type to extend', () => {
      expect(bare(string().equalTo('x').nullable())).toEqual({ anyOf: [{ const: 'x' }, { type: 'null' }] });
    });

    it('wraps an object', () => {
      expect(bare(object({ a: string() }).nullable())).toEqual({
        type: ['object', 'null'],
        properties: { a: { type: 'string' } },
        required: ['a'],
        additionalProperties: false,
      });
    });
  });

  describe('recursive schemas', () => {
    interface Category {
      name: string;
      children: Category[];
    }
    const categorySchema: CommonSchema = object({
      name: string(),
      children: array(lazy<Category>('Category', () => categorySchema)),
    });

    it('references itself through $defs instead of recursing forever', () => {
      const generated = bare(categorySchema);

      expect((generated.properties as Record<string, unknown>).children).toEqual({
        type: 'array',
        items: { $ref: '#/$defs/Category' },
      });
      expect(generated.$defs).toHaveProperty('Category');
    });

    it('wraps a $ref for nullability, since $ref takes no sibling', () => {
      const nullableLazy = lazy<Category>('Category', () => categorySchema).nullable();

      expect(bare(nullableLazy)).toEqual({
        anyOf: [{ $ref: '#/$defs/Category' }, { type: 'null' }],
        $defs: expect.anything(),
      });
    });

    it('reports a lazy getter that does not return a schema', () => {
      const broken = lazy<string>('Broken', () => 'nope' as unknown as CommonSchema);

      expect(() => bare(broken)).toThrow('Invalid schema returned from lazy method');
    });

    it('omits $defs when nothing needed naming', () => {
      expect(bare(string())).not.toHaveProperty('$defs');
    });
  });

  describe('the document itself', () => {
    it('declares the 2020-12 dialect by default', () => {
      expect(toJSONSchema(string())).toEqual({
        $schema: 'https://json-schema.org/draft/2020-12/schema',
        type: 'string',
      });
    });

    it('takes a different dialect', () => {
      expect(toJSONSchema(string(), { dialect: 'http://json-schema.org/draft-07/schema#' }).$schema).toBe(
        'http://json-schema.org/draft-07/schema#',
      );
    });

    it('leaves the dialect out when asked, for embedding in a larger document', () => {
      expect(toJSONSchema(string(), { dialect: null })).toEqual({ type: 'string' });
    });

    it('carries a description', () => {
      expect(bare(string().description('The name'))).toEqual({ type: 'string', description: 'The name' });
    });

    it('does not carry an id, which JSON Schema has no place for', () => {
      expect(bare(string().id('name'))).toEqual({ type: 'string' });
    });
  });
});
