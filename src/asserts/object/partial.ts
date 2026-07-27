import { WithObject, WithUndefined } from '../../commonTypes';
import { CommonSchema, ObjectShapeSchemaType } from '../../core';
import { ObjectSchema } from './index';
import { _objectFrom, _shapeOf } from './pick';

/**
 * Named rather than written inline in both the signature and the cast: the two spellings of the same
 * mapped type are not provably identical to the compiler once `~standard` puts a deferred
 * `InferType<this>` inside them.
 */
type PartialShape<T extends ObjectShapeSchemaType> = { [K in keyof T]: WithUndefined<T[K]> };

/**
 * @description Creates a new object schema in which every property is optional.
 *
 * Each property schema is made optional in its own right, so the original schema and the property
 * schemas it holds are unchanged.
 *
 * @template T
 * @param {WithObject<CommonSchema, T>} schema - The object schema to relax.
 * @returns A new object schema with every property optional.
 * @example
 * const userSchema = object({ id: string(), name: string() });
 * const patchSchema = partial(userSchema);
 * parseOrFail(patchSchema, {}); // Validates successfully
 *
 * @instance Of CommonSchema
 */
export function partial<T extends ObjectShapeSchemaType>(
  schema: WithObject<CommonSchema, T>,
): WithObject<ObjectSchema, PartialShape<T>> {
  const shape = _shapeOf(schema, 'partial');
  const relaxed: ObjectShapeSchemaType = {};

  for (const [key, valueSchema] of Object.entries(shape)) {
    relaxed[key] = valueSchema.optional() as CommonSchema;
  }

  return _objectFrom(schema, relaxed) as unknown as WithObject<ObjectSchema, PartialShape<T>>;
}
