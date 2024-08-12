import { ObjectShapeSchemaType } from '../../schemas/CommonSchema';
import { ObjectSchema, WithObject } from '../../schemas/ObjectSchema';

/**
 * Creates a new schema for validating objects where each property must match the specified schema.
 *
 * @template T
 * @param {T} shapeSchema - The schema that each property of the object must match.
 * @returns {WithObject<T>} A new instance of `ObjectSchema` for validating objects with properties matching the specified schema.
 *
 * @example
 * const schema = object({
 *   name: string(),
 *   age: number()
 * });
 * parseSchema(schema, { name: 'John', age: 30 }); // Validates successfully
 * parseSchema(schema, { name: 'John', age: '30' }); // Throws a validation error
 */
export function object<T extends ObjectShapeSchemaType>(shapeSchema: T): WithObject<T> {
  return new ObjectSchema({ type: [], requiredValidations: [] }, shapeSchema) as WithObject<T>;
}
