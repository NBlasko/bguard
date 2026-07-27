import { WithObject } from '../../commonTypes';
import { BuildSchemaError } from '../../exceptions';
import { ctxSymbol } from '../../helpers/constants';
import { CommonSchema, ValidatorContext, type ObjectShapeSchemaType } from '../../core';

class ObjectSchema extends CommonSchema {
  protected _object = 1;
  constructor(ctx: ValidatorContext, shapeSchema: ObjectShapeSchemaType) {
    super(ctx);
    this.validateObjectEntry(shapeSchema);
    this[ctxSymbol].object = shapeSchema;
  }

  private validateObjectEntry(shapeSchema: ObjectShapeSchemaType) {
    if (!shapeSchema) throw new BuildSchemaError('Missing schema in object method');
    if (shapeSchema instanceof CommonSchema) throw new BuildSchemaError('Invalid schema in object');
    for (const [key, value] of Object.entries(shapeSchema)) {
      if (!(value instanceof CommonSchema))
        throw new BuildSchemaError(`Invalid schema in object method for property '${key}'`);
    }
  }

  /**
   * @method allowUnrecognized
   * @description Allows unrecognized properties in the validated object.
   * When this method is called, the validation will not fail
   * if the received object contains properties not specified
   * in the validation schema.
   * @returns {this} The current ObjectSchema instance.
   * @example
   *  const userSchema = object({
   *    name: string(),
   *    age: number(),
   *  }).allowUnrecognized();
   *
   * parseOrFail(userSchema, ({ name: 'John', age: 30, extra: 'value' }););
   * //  No error thrown
   *
   * @public
   */
  public allowUnrecognized(): this {
    const next = this.clone();
    next[ctxSymbol].allowUnrecognizedObjectProps = true;
    return next;
  }
}

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
