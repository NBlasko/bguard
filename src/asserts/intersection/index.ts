import { IntersectShapes, WithObject } from '../../commonTypes';
import { CommonSchema, ObjectShapeSchemaType, RequiredValidation } from '../../core';
import { ObjectSchema } from '../object/index';
import { BuildSchemaError } from '../../exceptions';
import { ctxSymbol } from '../../helpers/constants';

type ObjectSchemaLike = WithObject<CommonSchema, ObjectShapeSchemaType>;

/**
 * @description Combines several object schemas into one that requires all of them.
 *
 * The shapes are merged when the schema is built, so the result is an ordinary object schema: a key
 * declared by any member is recognised, and validation, inference and code generation all follow from
 * the merged shape. That is what makes `intersection([object({ a }), object({ b })])` accept
 * `{ a, b }` — validating against each member separately would have the first reject `b` as an
 * unrecognised property.
 *
 * Members must be object schemas, and a key may not be declared twice. Two members declaring the same
 * key would give `A & B` for that property in the type while only one schema could run at validation
 * time, so it is rejected rather than silently resolved one way.
 *
 * @template T
 * @param {T} intersectionSchemas - The object schemas to combine.
 * @returns A new object schema inferring the intersection of its members' types.
 * @example
 * const withId = object({ id: string() });
 * const withName = object({ name: string() });
 * const schema = intersection([withId, withName]);
 * parseOrFail(schema, { id: '1', name: 'a' }); // Validates successfully
 * parseOrFail(schema, { id: '1' }); // Throws a validation error
 *
 * @instance Of CommonSchema
 */
export function intersection<T extends [ObjectSchemaLike, ...ObjectSchemaLike[]]>(
  intersectionSchemas: T,
): WithObject<ObjectSchema, IntersectShapes<T>> {
  if (!Array.isArray(intersectionSchemas) || !intersectionSchemas.length)
    throw new BuildSchemaError('Missing schemas in intersection method');

  const mergedShape: ObjectShapeSchemaType = {};
  const mergedValidations: RequiredValidation[] = [];
  let allowUnrecognized = false;

  intersectionSchemas.forEach((intersectionSchema, index) => {
    if (!(intersectionSchema instanceof CommonSchema))
      throw new BuildSchemaError(`Invalid schema in intersection method at index '${index}'`);

    const memberData = intersectionSchema[ctxSymbol];
    if (!memberData.object)
      throw new BuildSchemaError(`Schema in intersection method at index '${index}' is not an object schema`);

    // A nullable or optional member would mean `({ a } | null) & { b }`, which the merged shape
    // cannot express. Rejected rather than quietly dropped.
    if (memberData.isNullable || memberData.isOptional)
      throw new BuildSchemaError(`Schema in intersection method at index '${index}' cannot be nullable or optional`);

    for (const [key, valueSchema] of Object.entries(memberData.object)) {
      if (Object.prototype.hasOwnProperty.call(mergedShape, key))
        throw new BuildSchemaError(`Duplicate property '${key}' in intersection method`);

      mergedShape[key] = valueSchema;
    }

    mergedValidations.push(...memberData.requiredValidations);
    allowUnrecognized = allowUnrecognized || Boolean(memberData.allowUnrecognizedObjectProps);
  });

  // A real ObjectSchema, not a bare CommonSchema: the result is an object schema in every respect,
  // including the methods that only that class defines, such as allowUnrecognized.
  return new ObjectSchema(
    {
      type: [],
      requiredValidations: mergedValidations,
      allowUnrecognizedObjectProps: allowUnrecognized || undefined,
    },
    mergedShape,
  ) as WithObject<ObjectSchema, IntersectShapes<T>>;
}
