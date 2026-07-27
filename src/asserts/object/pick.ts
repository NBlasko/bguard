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

  return _objectFrom(schema, picked) as unknown as WithObject<ObjectSchema, Pick<T, K>>;
}

/** Reads the shape of a schema that must be an object schema. Shared by the object utilities. */
export function _shapeOf(schema: CommonSchema, methodName: string): ObjectShapeSchemaType {
  if (!(schema instanceof CommonSchema)) throw new BuildSchemaError(`Invalid schema in ${methodName} method`);

  const shape = schema[ctxSymbol].object;
  if (!shape) throw new BuildSchemaError(`Schema in ${methodName} method is not an object schema`);

  return shape;
}

/** Builds a new object schema from a shape, carrying over the source's own settings. */
export function _objectFrom(source: CommonSchema, shape: ObjectShapeSchemaType): ObjectSchema {
  const sourceData = source[ctxSymbol];

  return new ObjectSchema(
    {
      type: [],
      requiredValidations: [...sourceData.requiredValidations],
      allowUnrecognizedObjectProps: sourceData.allowUnrecognizedObjectProps,
      meta: sourceData.meta ? { ...sourceData.meta } : undefined,
    },
    shape,
  );
}
