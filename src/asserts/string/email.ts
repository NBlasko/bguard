import { guardException } from '../../exceptions';
import type { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';
// TODO skloni svuda @returns jer ne daje vrednost nikakvu
// TODOskloni ispred svako @see, @description, @param itd sve crte kao -
const emailRegExp = /^[^@]+@[^@]+\.[^@]+$/;

/**
 * @description Asserts that a string value matches the email pattern. The pattern checks for a basic email format.
 *
 * @throws an error if the received value does not match the email pattern.
 * 
 * @example
 * const schema = string().custom(email());
 * parseOrFail(schema, 'example@example.com'); // Valid
 * parseOrFail(schema, 'invalid-email');      // Throws an error: 'The received value does not match the required email pattern'
 */
export const email = (): RequiredValidation => (received: string, ctx: ExceptionContext) => {
  if (!emailRegExp.test(received))
    guardException(emailRegExp, received, ctx, 'The received value does not match the required email pattern');
};
