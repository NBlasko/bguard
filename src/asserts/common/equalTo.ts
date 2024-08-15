import { throwException } from '../../exceptions';
import { ExceptionContext, RequiredValidation } from '../../schemas/CommonSchema';

/**
 * Creates a custom assertion that checks if a value is equal to the expected value.
 *
 * This assertion can be used within a `.custom` method to enforce that a value strictly matches the expected value.
 * It will throw a `ValidationError` if the values are not equal.
 *
 * @param {unknown} expected - The value that the received value is expected to match.
 * @returns {RequiredValidation} A function that takes the received value and the path to the error,
 * and throws a `ValidationError` if the received value does not equal the expected value.
 *
 * @throws {ValidationError} If the received value does not match the expected value.
 *
 * @example
 * import { number, equalTo } from 'bguard';
 *
 * // Define a schema with a custom assertion
 * const schema = number().custom(equalTo(5));
 *
 * // This will pass
 * parseOrFail(schema, 5);
 *
 * // This will throw a ValidationError
 * parseOrFail(schema, 3);
 */
export const equalTo =
  (expected: unknown): RequiredValidation =>
  (received: number, ctx: ExceptionContext) => {
    if (expected !== received) throwException(expected, received, ctx, 'The received value is not equal to expected');
  };
