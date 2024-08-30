import { ctxSymbol } from '../helpers/core';
import { BuildSchemaError } from '../exceptions';
import { CommonSchema, ObjectShapeSchemaType, ValidatorContext } from './CommonSchema';

export class ObjectSchema extends CommonSchema {
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
   * Allows unrecognized properties in the validated object.
   * When this method is called, the validation will not fail
   * if the received object contains properties not specified
   * in the validation schema.
   *
   * @returns {this} The current ObjectSchema instance.
   *
   * @example
   *  const userSchema = object({
   *    name: string(),
   *    age: number(),
   *  }).allowUnrecognized();
   *
   * parseOrFail(userSchema, ({ name: 'John', age: 30, extra: 'value' }););
   * //  No error thrown
   */
  public allowUnrecognized(): this {
    this[ctxSymbol].allowUnrecognizedObjectProps = true;
    return this;
  }
}

export type WithObject<Y extends ObjectShapeSchemaType> = ObjectSchema & { validation_object: Y };
