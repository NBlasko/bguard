import { WithObject } from '../../commonTypes';
import { CommonSchema, ObjectShapeSchemaType } from '../../core';
import { BuildSchemaError } from '../../exceptions';
import { ObjectSchema } from './index';
import { _objectFrom, _shapeOf } from './pick';

/**
 * @description Creates a new object schema without the named properties.
 *
 * The original is untouched.
 *
 * **The source's OBJECT-level assertions are dropped**, for the reason `pick` records: this changes
 * which properties exist, so a rule about the source's shape may be about one that is now gone.
 * Re-attach any that still apply — `omit(userSchema, ['secret']).custom(rule)`.
 *
 * @template T
 * @template K
 * @param {WithObject<CommonSchema, T>} schema - The object schema to narrow.
 * @param {readonly K[]} keys - The properties to drop.
 * @returns A new object schema without those properties.
 * @example
 * const userSchema = object({ id: string(), name: string(), secret: string() });
 * const publicSchema = omit(userSchema, ['secret']);
 * parseOrFail(publicSchema, { id: '1', name: 'a' }); // Validates successfully
 *
 * @instance Of CommonSchema
 */
export function omit<T extends ObjectShapeSchemaType, K extends keyof T & string>(
  schema: WithObject<CommonSchema, T>,
  keys: readonly K[],
): WithObject<ObjectSchema, Omit<T, K>> {
  const shape = _shapeOf(schema, 'omit');
  const dropped = new Set<string>(keys);

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(shape, key))
      throw new BuildSchemaError(`Unknown property '${key}' in omit method`);
  }

  const kept: ObjectShapeSchemaType = {};
  for (const [key, valueSchema] of Object.entries(shape)) {
    if (!dropped.has(key)) kept[key] = valueSchema;
  }

  return _objectFrom(schema, kept, false) as unknown as WithObject<ObjectSchema, Omit<T, K>>;
}
