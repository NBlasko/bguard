import { WithUnion } from '../../commonTypes';
import { CommonSchema } from '../../core';
import { BuildSchemaError } from '../../exceptions';

/**
 * @description Creates a new schema that accepts a value matching any one of the given schemas.
 *
 * Members are tried in order and the first one that validates cleanly wins, so its parsed value is
 * the result. Order matters when members overlap: put the more specific member first.
 *
 * Unlike `oneOfTypes`, which only compares `typeof`, each member is a full schema, so members can
 * carry their own assertions and structure.
 *
 * @template T
 * @param {T} unionSchemas - The schemas the value may match.
 * @returns A new schema inferring the union of its members' types.
 * @example
 * const schema = union([string().custom(email()), number().custom(min(0))]);
 * parseOrFail(schema, 'a@b.com'); // Validates successfully
 * parseOrFail(schema, 42); // Validates successfully
 * parseOrFail(schema, true); // Throws a validation error
 *
 * @instance Of CommonSchema
 */
export function union<T extends [CommonSchema, ...CommonSchema[]]>(unionSchemas: T): WithUnion<CommonSchema, T> {
  if (!Array.isArray(unionSchemas) || !unionSchemas.length)
    throw new BuildSchemaError('Missing schemas in union method');

  unionSchemas.forEach((unionSchema, index) => {
    if (!(unionSchema instanceof CommonSchema))
      throw new BuildSchemaError(`Invalid schema in union method at index '${index}'`);
  });

  return new CommonSchema({ type: [], requiredValidations: [], union: [...unionSchemas] }) as WithUnion<
    CommonSchema,
    T
  >;
}
