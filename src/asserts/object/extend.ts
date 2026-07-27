import { WithObject } from '../../commonTypes';
import { CommonSchema, ObjectShapeSchemaType } from '../../core';
import { BuildSchemaError } from '../../exceptions';
import { ObjectSchema } from './index';
import { _objectFrom, _shapeOf } from './pick';

/**
 * @description Creates a new object schema with extra properties added.
 *
 * A property already declared is replaced by the one given here, which is what distinguishes `extend`
 * from `intersection`: `intersection` rejects a duplicate key because it has no basis for choosing,
 * while `extend` is an explicit instruction to override.
 *
 * @template T
 * @template U
 * @param {WithObject<CommonSchema, T>} schema - The object schema to build on.
 * @param {U} shapeSchema - The properties to add or replace.
 * @returns A new object schema with the merged properties.
 * @example
 * const baseSchema = object({ id: string() });
 * const timestamped = extend(baseSchema, { createdAt: string() });
 * parseOrFail(timestamped, { id: '1', createdAt: 'now' }); // Validates successfully
 *
 * @instance Of CommonSchema
 */
export function extend<T extends ObjectShapeSchemaType, U extends ObjectShapeSchemaType>(
  schema: WithObject<CommonSchema, T>,
  shapeSchema: U,
): WithObject<ObjectSchema, Omit<T, keyof U> & U> {
  const shape = _shapeOf(schema, 'extend');

  if (!shapeSchema || shapeSchema instanceof CommonSchema) throw new BuildSchemaError('Invalid shape in extend method');

  for (const [key, valueSchema] of Object.entries(shapeSchema)) {
    if (!(valueSchema instanceof CommonSchema))
      throw new BuildSchemaError(`Invalid schema in extend method for property '${key}'`);
  }

  return _objectFrom(schema, { ...shape, ...shapeSchema }) as unknown as WithObject<ObjectSchema, Omit<T, keyof U> & U>;
}
