import type { ExceptionContext, RequiredValidation } from '../../core';
import { setToDefaultLocale } from '../../translationMap';

const isCreditCardErrorMessage = 'The received value is not a valid card number';
const isCreditCardErrorKey = 's:isCreditCard';

// Digits, optionally grouped by single spaces or hyphens. Each repetition consumes exactly one digit, so
// the optional separator cannot make the match ambiguous.
const cardShape = /^\d(?:[ -]?\d)*$/;

// The Luhn checksum every payment card number carries in its last digit.
function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = digits.charCodeAt(digits.length - 1 - i) - 48;
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * @description Asserts that a string is a plausible payment card number: 12 to 19 digits, optionally
 * grouped by spaces or hyphens, whose last digit is the correct Luhn check digit. This catches typos; it
 * does not say that the card exists, nor which network issued it. The value is returned as received, with
 * its separators.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received string is not a valid card number.
 * @example
 * const schema = string().custom(isCreditCard());
 * parseOrFail(schema, '4111 1111 1111 1111'); // Valid
 * parseOrFail(schema, '4111 1111 1111 1112'); // Throws an error: the check digit is wrong
 *
 * @translation Error Translation Key = 's:isCreditCard'
 */
export const isCreditCard = (): RequiredValidation<string> => (received: string, ctx: ExceptionContext) => {
  // No JSON Schema mapping: a pattern can describe the shape but not the checksum.
  const digits = cardShape.test(received) ? received.replace(/[ -]/g, '') : '';
  if (digits.length < 12 || digits.length > 19 || !passesLuhn(digits)) {
    // The number itself is left out of `expected`, and the default message does not repeat it.
    ctx.addIssue('valid card number', received, isCreditCardErrorKey);
  }
};

isCreditCard.key = isCreditCardErrorKey;
isCreditCard.message = isCreditCardErrorMessage;
setToDefaultLocale(isCreditCard);
