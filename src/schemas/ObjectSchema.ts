import { ctxSymbol } from '../core';
import { BuildSchemaError } from '../exceptions';
import { CommonSchema, ObjectShapeSchemaType, ValidatorContext } from './CommonSchema';

export class ObjectSchema extends CommonSchema {
  _object = 1;
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
}

export type WithObject<Y extends ObjectShapeSchemaType> = ObjectSchema & { validation_object: Y };
