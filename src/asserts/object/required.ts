import { WithObject } from '../../commonTypes';
import { CommonSchema, ObjectShapeSchemaType } from '../../core';
import { ctxSymbol } from '../../helpers/constants';
import { ObjectSchema } from './index';
import { _objectFrom, _shapeOf } from './pick';

/**
 * Named rather than written inline in both the signature and the cast: the two spellings of the same
 * mapped type are not provably identical to the compiler once `~standard` puts a deferred
 * `InferType<this>` inside them.
 *
 * Removing the brand rather than trying to recover the type it wraps, because an intersection cannot
 * be taken apart again. What matters to `InferType` is that the result no longer carries the marker.
 */
type RequiredShape<T extends ObjectShapeSchemaType> = { [K in keyof T]: Omit<T[K], 'validation_undefined'> };

/**
 * @description Creates a new object schema in which every property is required, the counterpart to
 * `partial`.
 *
 * A property that carried a default keeps it, so it may still be omitted — a default is what makes a
 * property supply its own value rather than optional.
 *
 * @template T
 * @param {WithObject<CommonSchema, T>} schema - The object schema to tighten.
 * @returns A new object schema with every property required.
 * @example
 * const patchSchema = partial(object({ id: string(), name: string() }));
 * const fullSchema = required(patchSchema);
 * parseOrFail(fullSchema, { id: '1', name: 'a' }); // Validates successfully
 * parseOrFail(fullSchema, {}); // Throws a validation error
 *
 * @instance Of CommonSchema
 */
export function required<T extends ObjectShapeSchemaType>(
  schema: WithObject<CommonSchema, T>,
): WithObject<ObjectSchema, RequiredShape<T>> {
  const shape = _shapeOf(schema, 'required');
  const tightened: ObjectShapeSchemaType = {};

  for (const [key, valueSchema] of Object.entries(shape)) {
    // A copy, so the property schema the source holds keeps whatever it had.
    const tightenedSchema = valueSchema.clone();
    delete tightenedSchema[ctxSymbol].isOptional;
    tightened[key] = tightenedSchema;
  }

  return _objectFrom(schema, tightened) as unknown as WithObject<ObjectSchema, RequiredShape<T>>;
}
