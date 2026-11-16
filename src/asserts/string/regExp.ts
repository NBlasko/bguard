import type { ExceptionContext, RequiredValidation } from '../../core';
import { _constrain } from '../../helpers/jsonSchemaConstraint';
import { setToDefaultLocale } from '../../translationMap';

const regExpErrorMessage = 'The received value does not match the required text pattern';
const regExpErrorKey = 's:regExp';

// Flags whose meaning a bare JSON Schema `pattern` keeps. `g` and `d` do not change what matches, and
// `u` is how JSON Schema validators compile patterns anyway. `i`, `m`, `s`, `y` and `v` change the match,
// and a `pattern` cannot carry flags, so emitting the source alone would describe a different rule.
const portableFlags = /^[gdu]*$/;

/**
 * @description Asserts that a string value matches a specified regular expression pattern.
 * @param {RegExp} expected The regular expression pattern that the string value should match. A `g` or
 * `y` flag does not make validation stateful: every value is tested from the start of the string.
 * @returns {RequiredValidation} A validation function that takes a received string and an exception context.
 * @throws {ValidationError} if the received value does not match the expected pattern.
 * @example
 * const schema = string().custom(regExp(/^[A-Za-z0-9]+$/)); // Validates against alphanumeric pattern
 * parseOrFail(schema, 'valid123');   // Valid
 * parseOrFail(schema, 'invalid!@#'); // Throws an error: 'The received value does not match the required text pattern'
 *
 * @translation Error Translation Key = 's:regExp'
 */
export const regExp = (expected: RegExp): RequiredValidation<string> => {
  // `test` on a `g` or `y` regex starts from `lastIndex` and moves it, so the same value used to pass
  // and fail on alternate parses. A private copy is rewound before every test, which also leaves the
  // caller's regex and its `lastIndex` alone.
  const pattern = new RegExp(expected.source, expected.flags);
  const validation = (received: string, ctx: ExceptionContext) => {
    pattern.lastIndex = 0;
    if (!pattern.test(received)) ctx.addIssue(expected, received, regExpErrorKey);
  };
  // Left out of the generated document when the flags would be lost, so it accepts more rather than
  // something else: `/abc/i` used to become `pattern: "abc"` and reject `ABC`, which bguard accepts.
  return portableFlags.test(expected.flags) ? _constrain({ pattern: expected.source }, validation) : validation;
};

regExp.key = regExpErrorKey;
regExp.message = regExpErrorMessage;
setToDefaultLocale(regExp);
