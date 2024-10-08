import { WithObject } from '../../commonTypes';
import { ObjectShapeSchemaType } from '../../schemas/CommonSchema';
import { ObjectSchema } from '../../schemas/ObjectSchema';

/**
 * @description Creates a new schema for validating objects where each property must match the specified schema.
 * @template T
 * @param {T} shapeSchema - The schema that each property of the object must match.
 * @returns {WithObject<ObjectSchema, T>} A new instance of `ObjectSchema` for validating objects with properties matching the specified schema.
 * @example
 * const schema = object({
 *   name: string(),
 *   age: number()
 * });
 * parseOrFail(schema, { name: 'John', age: 30 }); // Validates successfully
 * parseOrFail(schema, { name: 'John', age: '30' }); // Throws a validation error
 *
 * @instance Of ObjectSchema
 */
export function object<T extends ObjectShapeSchemaType>(shapeSchema: T): WithObject<ObjectSchema, T> {
  return new ObjectSchema({ type: [], requiredValidations: [] }, shapeSchema) as WithObject<ObjectSchema, T>;
}
