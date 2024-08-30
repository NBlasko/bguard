import { ctxSymbol } from '../helpers/core';
import { BuildSchemaError } from '../exceptions';
import { CommonSchema, ValidatorContext } from './CommonSchema';

export class ArraySchema extends CommonSchema {
  protected _array = 1;
  constructor(ctx: ValidatorContext, arraySchema: CommonSchema) {
    super(ctx);
    this.validateArrayEntry(arraySchema);
    this[ctxSymbol].array = arraySchema;
  }

  private validateArrayEntry(arraySchema: CommonSchema) {
    if (!arraySchema) throw new BuildSchemaError('Missing schema in array method');
    if (!(arraySchema instanceof CommonSchema)) throw new BuildSchemaError('Invalid schema in array method');
  }
}

export type WithArray<Y extends CommonSchema> = ArraySchema & { validation_array: Y };
export type ExtractFromArray<T> = T extends WithArray<infer X> ? X : never;
