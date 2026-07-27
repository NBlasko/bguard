import { WithTuple } from '../../commonTypes';
import { CommonSchema } from '../../core';
import { BuildSchemaError } from '../../exceptions';

/**
 * @description Creates a new schema for an array of a fixed length, where each position has its own
 * schema.
 *
 * The received value must be an array of exactly that many entries. Unlike `array`, which applies one
 * schema to every element, each position here is validated against the schema declared for it, and
 * the inferred type keeps the positions distinct.
 *
 * @template T
 * @param {T} tupleSchemas - The schema for each position, in order.
 * @returns A new schema inferring a tuple of its positions' types.
 * @example
 * const schema = tuple([string(), number()]);
 * parseOrFail(schema, ['a', 1]); // Validates successfully
 * parseOrFail(schema, [1, 'a']); // Throws a validation error
 * parseOrFail(schema, ['a']); // Throws a validation error, wrong length
 *
 * @instance Of CommonSchema
 */
export function tuple<T extends [CommonSchema, ...CommonSchema[]]>(tupleSchemas: T): WithTuple<CommonSchema, T> {
  if (!Array.isArray(tupleSchemas) || !tupleSchemas.length)
    throw new BuildSchemaError('Missing schemas in tuple method');

  tupleSchemas.forEach((tupleSchema, index) => {
    if (!(tupleSchema instanceof CommonSchema))
      throw new BuildSchemaError(`Invalid schema in tuple method at index '${index}'`);
  });

  return new CommonSchema({ type: [], requiredValidations: [], tuple: [...tupleSchemas] }) as WithTuple<
    CommonSchema,
    T
  >;
}
