import { WithObject } from '../../commonTypes';
import { CommonSchema, ObjectShapeSchemaType } from '../../core';
import { BuildSchemaError } from '../../exceptions';
import { ctxSymbol } from '../../helpers/constants';
import { ObjectSchema } from './index';

/**
 * @description Creates a new object schema keeping only the named properties.
 *
 * The original is untouched, and the properties keep the schemas they had, including their assertions
 * and metadata.
 *
 * **The source's OBJECT-level assertions are dropped** — those added with
 * `object({…}).custom(rule)`, not the ones on each property, which are kept. A rule written about
 * the source's shape may be about a property this result does not have, and it would run anyway:
 * measured, `pick(object({ email, phone }).custom(oneOfThem), ['email'])` reported "one contact
 * method" for `{ email: '' }`, naming a `phone` field the picked schema does not declare.
 *
 * A rule that only reads properties you kept is still meaningful, and it is dropped along with the
 * rest, because nothing can tell the two apart — an object `custom` receives the whole value and
 * reads it directly. Re-attach it: `pick(userSchema, ['id', 'name']).custom(rule)`.
 *
 * @template T
 * @template K
 * @param {WithObject<CommonSchema, T>} schema - The object schema to narrow.
 * @param {readonly K[]} keys - The properties to keep.
 * @returns A new object schema with only those properties.
 * @example
 * const userSchema = object({ id: string(), name: string(), secret: string() });
 * const publicSchema = pick(userSchema, ['id', 'name']);
 * parseOrFail(publicSchema, { id: '1', name: 'a' }); // Validates successfully
 *
 * @instance Of CommonSchema
 */
export function pick<T extends ObjectShapeSchemaType, K extends keyof T & string>(
  schema: WithObject<CommonSchema, T>,
  keys: readonly K[],
): WithObject<ObjectSchema, Pick<T, K>> {
  const shape = _shapeOf(schema, 'pick');
  const picked: ObjectShapeSchemaType = {};

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(shape, key))
      throw new BuildSchemaError(`Unknown property '${key}' in pick method`);

    picked[key] = shape[key] as CommonSchema;
  }

  return _objectFrom(schema, picked, false) as unknown as WithObject<ObjectSchema, Pick<T, K>>;
}

/** Reads the shape of a schema that must be an object schema. Shared by the object utilities. */
export function _shapeOf(schema: CommonSchema, methodName: string): ObjectShapeSchemaType {
  if (!(schema instanceof CommonSchema)) throw new BuildSchemaError(`Invalid schema in ${methodName} method`);

  const shape = schema[ctxSymbol].object;
  if (!shape) throw new BuildSchemaError(`Schema in ${methodName} method is not an object schema`);

  return shape;
}

/**
 * Builds a new object schema from a shape, carrying over the source's own settings.
 *
 * `keepAssertions` decides the one setting where the utilities genuinely differ: the assertions
 * attached to the OBJECT — `object({…}).custom(rule)` — as opposed to those on its properties.
 *
 * **Which properties exist** is the question. `pick` and `omit` change it, so a rule written about
 * the source's shape may be about a property the result does not have; it ran anyway, against a
 * value that could not satisfy it. Measured on a two-field schema with a "one of these is required"
 * rule: `pick(schema, ['email'])` reported that failure for `{ email: '' }`, naming a `phone` field
 * the picked schema does not declare.
 *
 * `partial`, `required` and `extend` leave the property SET intact — the first two change whether a
 * property may be absent, the third adds — so a rule about the source is still a rule about the
 * result, and dropping it would quietly remove a check.
 *
 * Passed explicitly at every call site rather than defaulted, because the answer is the thing that
 * differs and a default is a thing to forget.
 *
 * `allowUnrecognizedObjectProps` and `meta` always carry: they describe the object itself rather
 * than any property of it.
 */
export function _objectFrom(source: CommonSchema, shape: ObjectShapeSchemaType, keepAssertions: boolean): ObjectSchema {
  const sourceData = source[ctxSymbol];

  return new ObjectSchema(
    {
      type: [],
      requiredValidations: keepAssertions ? [...sourceData.requiredValidations] : [],
      allowUnrecognizedObjectProps: sourceData.allowUnrecognizedObjectProps,
      meta: sourceData.meta ? { ...sourceData.meta } : undefined,
    },
    shape,
  );
}
