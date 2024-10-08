import { ctxSymbol } from '../helpers/core';
import { CommonSchema, ValidatorContext } from './CommonSchema';

export class DateSchema extends CommonSchema {
  protected _date = 1;

  constructor(ctx: ValidatorContext) {
    super(ctx);
    this[ctxSymbol].date = true;
  }
}
