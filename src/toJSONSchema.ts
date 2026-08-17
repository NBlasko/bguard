import type { BaseType } from './commonTypes';
import { CommonSchema, type ValidatorContext } from './core';
import { BuildSchemaError } from './exceptions';
import { ctxSymbol } from './helpers/constants';
import { setOwnProperty } from './helpers/setOwnProperty';

export interface JSONSchema {
  [keyword: string]: unknown;
}

export interface ToJSONSchemaOptions {
  /**
   * The dialect to declare in `$schema`. Pass `null` to leave it out, which is what you want when the
   * result is embedded in a larger document such as an OpenAPI `components.schemas` entry.
   * @default 'https://json-schema.org/draft/2020-12/schema'
   */
  dialect?: string | null;
}

/** What a bguard primitive is called in JSON Schema. */
const typeNames: Partial<Record<BaseType, string>> = {
  string: 'string',
  number: 'number',
  boolean: 'boolean',
  object: 'object',
};

/** A validation may carry the JSON Schema keywords it stands for. Those that cannot, do not. */
interface ConstrainedValidation {
  jsonSchema?: JSONSchema;
}

interface Context {
  /** Named subschemas, filled as lazy schemas are met so a recursive schema can reference itself. */
  definitions: Record<string, JSONSchema>;
  /** Lazy type names currently being generated, so a self-reference emits a `$ref` instead of looping. */
  inProgress: Set<string>;
}

function constraintsOf(schemaData: ValidatorContext): JSONSchema {
  const constraints: JSONSchema = {};

  for (const validation of schemaData.requiredValidations) {
    const carried = (validation as ConstrainedValidation).jsonSchema;
    if (carried) Object.assign(constraints, carried);
  }

  return constraints;
}

function literalOf(schemaData: ValidatorContext): JSONSchema | undefined {
  if (!schemaData.strictType) return undefined;

  // equalTo stores one value, oneOfValues an array. String literals arrive already quoted for codeGen,
  // so the quotes have to come back off for JSON.
  const unquote = (value: unknown) =>
    typeof value === 'string' && value.startsWith("'") && value.endsWith("'")
      ? value.slice(1, -1).replace(/\\'/g, "'").replace(/\\\\/g, '\\')
      : value;

  if (Array.isArray(schemaData.strictTypeValue)) return { enum: schemaData.strictTypeValue.map(unquote) };

  return { const: unquote(schemaData.strictTypeValue) };
}

function baseOf(schemaData: ValidatorContext, context: Context): JSONSchema {
  if (schemaData.lazy) {
    const { typeName, getSchema } = schemaData.lazy;

    // A self-reference resolves to a pointer, which is what stops generation from recursing forever.
    if (context.inProgress.has(typeName)) return { $ref: `#/$defs/${typeName}` };

    schemaData.lazy.resolved ??= getSchema();
    if (!(schemaData.lazy.resolved instanceof CommonSchema))
      throw new BuildSchemaError('Invalid schema returned from lazy method');

    context.inProgress.add(typeName);
    context.definitions[typeName] = generate(schemaData.lazy.resolved, context);
    context.inProgress.delete(typeName);

    return { $ref: `#/$defs/${typeName}` };
  }

  if (schemaData.union) return { anyOf: schemaData.union.map((member) => generate(member, context)) };

  if (schemaData.tuple)
    return {
      type: 'array',
      // Draft 2020-12 spells positional schemas `prefixItems`, and forbidding extras is what makes it a
      // tuple rather than an array that happens to start a certain way.
      prefixItems: schemaData.tuple.map((position) => generate(position, context)),
      items: false,
      minItems: schemaData.tuple.length,
      maxItems: schemaData.tuple.length,
    };

  if (schemaData.record) {
    const keyLiteral = literalOf(schemaData.record.key[ctxSymbol]);
    const valueSchema = generate(schemaData.record.value, context);

    // A restricted key set becomes named properties. There is no `required`, because validation checks
    // the keys that are present rather than demanding the whole set — the same reason InferType says
    // Partial.
    if (keyLiteral?.enum)
      return {
        type: 'object',
        properties: Object.fromEntries((keyLiteral.enum as unknown[]).map((key) => [String(key), valueSchema])),
        additionalProperties: false,
      };

    return { type: 'object', additionalProperties: valueSchema };
  }

  if (schemaData.array) return { type: 'array', items: generate(schemaData.array, context) };

  if (schemaData.object) {
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const [key, valueSchema] of Object.entries(schemaData.object)) {
      const valueSchemaData = valueSchema[ctxSymbol];
      // A shape key of `__proto__` would otherwise set the prototype of `properties` and be missing
      // from the emitted schema, which is how a declared property silently stops being described.
      setOwnProperty(properties, key, generate(valueSchema, context));

      // A default supplies the value, so the caller need not send it — the same rule InferInput follows.
      if (!valueSchemaData.isOptional && valueSchemaData.defaultValue === undefined) required.push(key);
    }

    const objectSchema: JSONSchema = { type: 'object', properties };
    if (required.length) objectSchema.required = required;
    if (!schemaData.allowUnrecognizedObjectProps) objectSchema.additionalProperties = false;

    return objectSchema;
  }

  if (schemaData.date) return { type: 'string', format: 'date-time' };

  const named = schemaData.type.filter((type) => type !== 'undefined');
  if (!named.length) return {};

  const jsonTypes = named.map((type) => {
    const jsonType = typeNames[type];
    if (!jsonType) throw new BuildSchemaError(`Type '${type}' has no JSON Schema equivalent and cannot be generated`);

    return jsonType;
  });

  return { type: jsonTypes.length === 1 ? jsonTypes[0] : jsonTypes };
}

function generate(schema: CommonSchema, context: Context): JSONSchema {
  const schemaData = schema[ctxSymbol];
  const base = baseOf(schemaData, context);
  const literal = literalOf(schemaData);

  // A literal already says everything about the value, so the type is redundant beside it.
  let result: JSONSchema = literal ? { ...base, ...literal } : { ...base, ...constraintsOf(schemaData) };
  if (literal && result.type) delete result.type;

  if (schemaData.isNullable) {
    // `$ref` and `anyOf` cannot take a sibling type, so nullability has to wrap rather than merge.
    result = result.$ref || result.anyOf ? { anyOf: [result, { type: 'null' }] } : mergeNull(result);
  }

  if (schemaData.defaultValue !== undefined) result.default = schemaData.defaultValue;
  if (schemaData.meta?.description) result.description = schemaData.meta.description;

  return result;
}

/** Adds null to a plain type, which reads better than wrapping a single type in `anyOf`. */
function mergeNull(schema: JSONSchema): JSONSchema {
  if (typeof schema.type === 'string') return { ...schema, type: [schema.type, 'null'] };
  if (Array.isArray(schema.type)) return { ...schema, type: [...(schema.type as string[]), 'null'] };

  return { anyOf: [schema, { type: 'null' }] };
}

/**
 * Renders a schema as a JSON Schema document, for OpenAPI, form generators and tool definitions.
 *
 * What is represented: types, object properties and which of them are required, arrays, tuples,
 * records, unions, literals and enums, nullability, defaults, `description()`, and recursive schemas
 * via `$defs` and `$ref`. Assertions that map onto a JSON Schema keyword — string lengths and patterns,
 * numeric bounds, array lengths — are included; those with no equivalent are not, because JSON Schema
 * has no way to express them.
 *
 * `bigint` and `symbol` have no JSON Schema counterpart and raise a `BuildSchemaError` rather than
 * being quietly emitted as something they are not. A `date()` becomes `{ type: 'string', format:
 * 'date-time' }`, since JSON has no date type.
 *
 * @example
 * const schema = object({ name: string().custom(minLength(2)), age: number().optional() });
 * toJSONSchema(schema);
 * // {
 * //   $schema: 'https://json-schema.org/draft/2020-12/schema',
 * //   type: 'object',
 * //   properties: { name: { type: 'string', minLength: 2 }, age: { type: 'number' } },
 * //   required: ['name'],
 * //   additionalProperties: false,
 * // }
 */
export function toJSONSchema(schema: CommonSchema, options?: ToJSONSchemaOptions): JSONSchema {
  const context: Context = { definitions: {}, inProgress: new Set() };
  const generated = generate(schema, context);

  const dialect = options?.dialect === undefined ? 'https://json-schema.org/draft/2020-12/schema' : options.dialect;
  const document: JSONSchema = dialect ? { $schema: dialect, ...generated } : generated;

  if (Object.keys(context.definitions).length) document.$defs = context.definitions;

  return document;
}
