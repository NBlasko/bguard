import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const isHexColorErrorMessage = 'The received value is not a hexadecimal color';
const isHexColorErrorKey = 's:isHexColor';

// The four CSS forms: #RGB, #RGBA, #RRGGBB and #RRGGBBAA.
const hexColorPattern = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/**
 * @description Asserts that a string is a hexadecimal color as CSS writes it: `#` followed by 3, 4, 6 or
 * 8 hex digits (`#fff`, `#ffff`, `#ffffff`, `#ffffff80`), in either case. The `#` is required.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string is not a hexadecimal color.
 * @example
 * const schema = string().custom(isHexColor());
 * parseOrFail(schema, '#1E90FF'); // Valid
 * parseOrFail(schema, '1E90FF');  // Throws an error: 'The received value is not a hexadecimal color'
 * parseOrFail(schema, '#12345');  // Throws an error: 'The received value is not a hexadecimal color'
 *
 * @translation Error Translation Key = 's:isHexColor'
 */
export const isHexColor = (): RequiredValidation<string> =>
  _constrain({ pattern: hexColorPattern.source }, (received: string, ctx: ExceptionContext) => {
    if (!hexColorPattern.test(received)) ctx.addIssue('hexadecimal color', received, isHexColorErrorKey);
  });

isHexColor.key = isHexColorErrorKey;
isHexColor.message = isHexColorErrorMessage;
setToDefaultLocale(isHexColor);
