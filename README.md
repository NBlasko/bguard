# bguard

**bguard** is a powerful, flexible, and type-safe validation library for TypeScript. It allows developers to define validation schemas for their data structures and ensures that data conforms to the expected types and constraints.

![Coveralls branch](https://img.shields.io/coverallsCoverage/github/NBlasko/bguard) ![npm](https://img.shields.io/npm/dt/bguard) ![Known Vulnerabilities](https://snyk.io/test/github/NBlasko/bguard/badge.svg)

### Features

- **Type Inference**: Automatically infer TypeScript types from your validation schemas.
- **Custom Assertions**: Add custom validation logic for your schemas.
- **Chaining Methods**: Easily chain methods for complex validations.
- **Nested Validation**: Supports complex data structures, including arrays and objects.
- **Optional and Nullable Support**: Fine-grained control over optional and nullable fields.
- **Small Bundle Size**: Each assertion is in its own file, minimizing your final bundle size.
- **Lightweight**: No dependencies and optimized for performance.

### Installation

```bash
npm install bguard
```

### Usage

Here’s a basic example of how to use `bguard` to define and validate a schema.

#### Defining a Schema

Let's define a schema for a Student object:

```typeScript

import { InferType, string, number, array, object, boolean } from 'bguard';
import { email } from 'bguard/string/email';
import { min } from 'bguard/number/min';
import { max } from 'bguard/number/max';

// Example: Student Schema
const studentSchema = object({
  email: string().optional().custom(email()),
  age: number().custom(min(18), max(120)),
  address: string().nullable(),
  classes: array(
    object({
      name: string(),
      mandatory: boolean(),
      rooms: array(number()),
    }).optional()
  ),
  verified: boolean().optional(),
});

```

#### Inferring TypeScript Types

Using the InferType utility, you can infer the TypeScript type of the schema:

```typescript
type StudentSchema = InferType<typeof studentSchema>;
```

This will generate the following type:

```typeScript

type StudentSchema = {
  age: number;
  address: string | null;
  classes: ({
    name: string;
    mandatory: boolean;
    rooms: number[];
  } | undefined)[];
  email?: string | undefined;
  verified?: boolean | undefined;
}

```

#### Generating TypeScript Types with `codeGen`

If you prefer to generate TypeScript types as a string, you can use the `codeGen` function:

```typeScript
import { codeGen } from 'bguard/codeGen';
```

The `codeGen` function takes a schema and returns a string representing the inferred TypeScript type. This string can be written to a file or used in other ways where a static type definition is needed.

Example

```typeScript
const typeString = codeGen(studentSchema);
console.log(typeString);
```

This would output a string:

```typeScript
{
  email?: string | undefined;
  age: number;
  address: string | null;
  classes: ({
      name: string;
      mandatory: boolean;
      rooms: number[];
    } | undefined)[];
  verified?: boolean | undefined;
}
```

Note: The returned string does not include a type name or the `=` symbol. You would need to add these manually if you want a complete type definition.

#### Generating Named TypeScript Types with `codeGenWithName`

For convenience, if you want to generate a complete type definition including a name, use the `codeGenWithName` function:

```typeScript
import { codeGenWithName } from 'bguard/codeGen';
```

This function takes two parameters: the name of the type and the schema.

Example:

```typeScript
const namedTypeString = codeGenWithName('StudentSchema', studentSchema);
console.log(namedTypeString);
```

This would output a string:

```typeScript
type StudentSchema = {
  email?: string | undefined;
  age: number;
  address: string | null;
  classes: ({
      name: string;
      mandatory: boolean;
      rooms: number[];
    } | undefined)[];
  verified?: boolean | undefined;
}
```

#### Summary:

`codeGen(schema: CommonSchema): string` - Generates a string of the TypeScript type based on the schema. You need to manually add a type name and assignment if needed.

`codeGenWithName(typeName: string, schema: CommonSchema): string` - Generates a complete TypeScript type definition string, including the type keyword and type name.

### Validating Data

This library provides two methods to parse data against schemas: `parse` and `parseOrFail`. These methods help in validating the data and obtaining structured errors if any issues are found during validation.

Let's use above mentioned `studentSchema` and:

```typescript
// example of valid received data
const validStudentData = {
  age: 21,
  address: '123 Main St',
  classes: [
    {
      name: 'Math 101',
      mandatory: true,
      rooms: [101, 102],
    },
  ],
  email: 'student@example.com',
};

// example of invalid received data with multiple errors
const invalidStudentData = {
  age: -5,
  address: undefined,
  classes: [
    {
      name: true,
      mandatory: 'true',
      rooms: null,
    },
  ],
  email: 'invalid-example',
};
```

#### `parse` Method

The `parse` method validates the data and returns a tuple containing errors and the parsed value. This method allows you to choose whether to collect all errors or stop at the first error using an options flag.

**Syntax:**

```typescript
import { parse } from 'bguard';
// import other dependencies

const [errors, parsedValue] = parse(studentSchema, validStudentData, { getAllErrors: true });
```

Returns:

- If validation succeeds: `[undefined, parsedValue]`
- If there are validation errors: `[ValidationErrorData[], undefined]`

Options:

- `lng`: Specifies the language for error messages. Default is `'default'`.
- `getAllErrors`: If `true`, collects all validation errors. If `false` or `undefined`, stops at the first error. Turning off `getAllErrors` provides a runtime optimization, as it stops validation at the first error, avoiding unnecessary checks for the remaining received value.

#### `parseOrFail` Method

The `parseOrFail` method validates the data and throws an error on the first validation failure. It is useful when you want to halt processing immediately upon encountering an error.

**Syntax:**

```typeScript
import { parseOrFail } from 'bguard';
// import other dependencies

try {
  // Attempt to parse and validate the studentData using the studentSchema
  const validatedData = parseOrFail(studentSchema, validStudentData);
  // If the data is valid, validatedData will contain the parsed value with inferred TypeScript types
} catch (error) {
  // If the data does not conform to the schema, an error will be thrown
  console.error(error.message); // Logs the first validation error message, if any
}
```

Throws:

- `ValidationError`: If any validation rule fails, this error is thrown with details of the first encountered error.

Options:

- `lng`: Specifies the language for error messages. Default is `'default'`.

####

Explanation

- **`parse` Method**: This method returns a tuple where the first element is an array of validation errors (if any), and the second element is the successfully parsed value (or `undefined` if errors exist). It allows collecting all errors by setting the `getAllErrors` flag.

- **`parseOrFail` Method**: This method throws a `ValidationError` when the first validation rule fails, making it suitable for scenarios where early termination of validation is desired.

- **Options**: Both methods accept options for language settings and error collection, enhancing flexibility in handling validation processes.

### Chaining Methods

- `nullable()`: Allows the value to be null.
- `optional()`: Allows the value to be undefined.

Example:

```typeScript

const schema = string().nullable().optional();
```

- String Literals:
  `string().equalTo('myStringValue')` will infer <b>'myStringValue'</b> as the type.
  `string().oneOfValues(['foo', 'bar'])` will infer <b>'foo' | 'bar'</b> as the type.

- Number Literals:
  `number().equalTo(42)` will infer <b>42</b> as the type.
  `number().oneOfValues([3, 5])` will infer <b>3 | 5</b> as the type.

- Boolean Literals:
  `boolean().onlyTrue()` will infer <b>true</b> as the type.
  `boolean().onlyFalse()` will infer <b>false</b> as the type.

### Custom (Library Built-in) Assertions

The `custom` method allows you to extend the validation schema with additional asserts. These asserts can either be user-defined or selected from the comprehensive set provided by the library. This flexibility ensures that you can tailor validations to meet specific requirements beyond the standard methods available.
All built-in asserts are documented in the [Built-in Custom Assert Documentation](#builtin_custom_assert_documentation) section.

Example

```typeScript
import { min } from 'bguard/number/min';
import { max } from 'bguard/number/max';

const ageSchema = number().custom(min(18), max(120));
```

Library built-in assertions are imported from specific paths for better tree-shaking and smaller bundle sizes.

### Create Custom Assertions

Bguard allows developers to create custom validation functions that can be integrated seamlessly with the library's existing functionality. Below is a detailed example demonstrating how to create a custom validation function, `minLength`, and how to properly document and map error messages for translations.

Example: Creating a `minLength` Custom Validation

```typescript
import { guardException } from 'bguard/exceptions';
import { ExceptionContext, RequiredValidation } from 'bguard/commonTypes';
import { setToDefaultLocale } from 'bguard/translationMap';

const minLengthErrorMessage = 'The received value {{r}} is shorter than the expected length {{e}}';
const minLengthErrorKey = 'customPrefix:minLength';

export const minLength =
  (expected: number): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (received.length < expected) {
      guardException(expected, received, ctx, minLengthErrorKey);
    }
  };

minLength.key = minLengthErrorKey;
minLength.message = minLengthErrorMessage;
setToDefaultLocale(minLength);
```

Explanation

- Error Key (`minLength.key`): This key (`'customPrefix:minLength'`) uniquely identifies the validation and is used for mapping error messages, especially when supporting multiple languages. It's essential to avoid collisions with built-in assertions, which use prefixes like `s:`, `n:`, and `b:` etc. More on that in [Common and Custom Translations](#common_and_custom_translations).

- Error Message (`minLength.message`): The message supports [interpolation](#translation), where `{{e}}` will be replaced by the expected value, and `{{r}}` will be replaced by the received value during validation .

- Exception Handling (`guardException`): This function is responsible for throwing the error when the validation fails. The `ctx` parameter must be passed to ensure the internal logic of the application works correctly.

- Localization Support (`setToDefaultLocale`): This function registers the default error message with its associated key. If you later decide to support multiple languages, you can easily map this key to different messages.

- Key Points for Developers:

  1. Always create unique error keys for custom validations to avoid potential conflicts with Bguard's built-in validations.
  2. Custom validations should use prefixes other than `s:`, `n:`, `b:`, and similar ones reserved for Bguard's internal validations.
  3. The `minLengthErrorMessage` serves as the default message. If you want to provide translations, you can do so by mapping the error key in the translationMap.
     For single-language applications, you can override the default message by directly passing your custom message to `guardException`.

### Translation {#translation}

Bguard provides default translations for error messages, but you can customize them as needed. Each potential error has an `errorKey` and `errorMessage`.

Example:

Consider the schema:

```typeScript
const testSchema = object({ foo: number().custom(min(5)) });
```

The `min` function has:

```typeScript
const minErrorMessage = 'The received value is less than expected'; // Default error message
const minErrorKey = 'n:min'; // Error key
```

If you want to change the error message for `min`, you can do so by importing the `setLocale` function and setting your custom message:

```typeScript
import { setLocale } from 'bguard/translationMap';

setLocale('SR', {
  'n:min': 'The received value {{r}} found on path {{p}} is less than expected value {{e}}',
  // ... continue adding other translations
});
```

With this setup, in the translation namespace 'SR', if the received value is 4, you'll get an error message like:

`'The received value 4 found on path .foo is less than expected value 5'`

- `{{r}}` - Replaced with the received value.
- `{{p}}` - Replaced with the path to the error.
- `{{e}}` - Replaced with the expected value.

> **Notice:** Do not overwrite the 'default' namespace. If a translation is missing, it will fall back to the 'default' translation.

#### Using Translations

To apply the new translation, both `parse` and `parseOrFail` functions accept a lng property in the options object provided as the third parameter:

```typeScript
parseOrFail(testSchema, { foo: 4 }, { lng: 'SR' });
// or
parse(testSchema, { foo: 4 }, { lng: 'SR' });
```

#### Common and Custom Translations {#common_and_custom_translations}

We have two sets of translations: common errors and specific assertions.

<b>Common Error Translations</b>:

```
'c:optional': 'The required value is missing',
'c:nullable': 'Value should not be null',
'c:array': 'Expected an array but received a different type',
'c:objectType': 'Expected an object but received a different type',
'c:objectTypeAsArray': 'Expected an object but received an array. Invalid type of data',
'c:unrecognizedProperty': 'This property is not allowed in the object',
'c:requiredProperty': 'Missing required property in the object',
'c:invalidType': 'Invalid type of data',
'c:isBoolean': 'The received value is not {{e}}',
```

<b>Custom Assertion Translations</b>:

For custom assertions, each key and message are located in separate files for better code splitting. There are multiple ways to identify a key:

<b>1.</b> Key Construction:
Keys are constructed as `'{typeId}:{functionName}'`, where `typeId` represents:

- c - common
- n - numbers
- s - strings
- b - boolean
- a - array
- o - object
- sy - symbol
- f - function
- bi - bigint
- m - mixed

Each `typeId` maps to the folder from which custom assertions are retrieved (except 'common', as explained above).

Example:

```typeScript
import { maxLength } from 'bguard/string/maxLength';
```

The function located in `'bguard/string/maxLength'` will have the key `'s:maxLength'`.

<b>2.</b> Assertion Function Properties:

Each assert function has two additional properties: `key` and `message`.

```typeScript
import { maxLength } from 'bguard/string/maxLength';

console.log(maxLength.key); // Output: 's:maxLength'
console.log(maxLength.message); // Output: 'The received value length is greater than expected'
```

> **Notice:** Do not directly change these values.

<b>3.</b> IDE Support:
Each key and message will be visible in text editors that support JSDoc IntelliSense.
### Built-in Custom Assert Documentation {#builtin_custom_assert_documentation} 

#### mix
        
##### equalTo (mix)
        
```typescript
import { equalTo } from 'bguard/mix/equalTo';
```
        
* _Description_ Creates a custom assertion that checks if a value is equal to the expected value.
* > **Notice:** It has already been implemented in the number and string schema. There is no need to use it as a custom assert.
* _Param_ {unknown} expected The value that the received value is expected to match.
* _Throws_ {ValidationError} If the received value does not match the expected value.
* _Example_
```typescript
 const schema = number().custom(equalTo(5)); // Define a schema with a custom assertion
 parseOrFail(schema, 5); // Valid
 parseOrFail(schema, 3); // Throws an error: 'The received value is not equal to expected'
```
* _See_ Error Translation Key = 'm:equalTo'
        
        
##### oneOfValues (mix)
        
```typescript
import { oneOfValues } from 'bguard/mix/oneOfValues';
```
        
* _Description_ Creates a custom assertion that checks if a value is equal to the one of expected values.
* > **Notice:** It has already been implemented in the number and string schema. There is no need to use it as a custom assert.
* _Param_ {unknown} expected The value that the received value is expected to match.
* _Throws_ {ValidationError} If the received value does not match at least one of the expected values.
* _Example_
```typescript
 const schema = number().custom(oneOfValues([5, 4])); // Define a schema with a custom assertion
 parseOrFail(schema, 5); // Valid
 parseOrFail(schema, 4); // Valid
 parseOrFail(schema, 3); // Throws an error: 'The received value is not equal to expected'
```
* _See_ Error Translation Key = 'm:oneOfValues'
        
#### number
        
##### max (number)
        
```typescript
import { max } from 'bguard/number/max';
```
        
* _Description_ Asserts that a number value does not exceed a specified maximum value.
* _Param_ {number} expected The maximum allowable value.
* _Throws_ {ValidationError} if the received value exceeds the expected maximum value.
* _Example_
```typescript
 const schema = number().custom(max(100));
 parseOrFail(schema, 99);  // Valid
 parseOrFail(schema, 100); // Valid
 parseOrFail(schema, 101); // Throws an error: 'The received value is greater than expected'
```
* _See_ Error Translation Key = 'n:max'
        
        
##### maxExcluded (number)
        
```typescript
import { maxExcluded } from 'bguard/number/maxExcluded';
```
        
* _Description_ - Asserts that a number value is strictly less than a specified maximum value (i.e., the maximum value is excluded).
* _Param_ {number} expected - The maximum allowable value, which is excluded.
* _Throws_ {ValidationError} if the received value is greater than or equal to the expected maximum value.
* _Example_
```typescript
 const schema = number().custom(maxExcluded(100));
 parseOrFail(schema, 99);  // Valid
 parseOrFail(schema, 100); // Throws an error: 'The received value is greater than or equal to expected'
 parseOrFail(schema, 101); // Throws an error: 'The received value is greater than or equal to expected'
```
* _See_ Error Translation Key = 'n:maxExcluded'
        
        
##### min (number)
        
```typescript
import { min } from 'bguard/number/min';
```
        
* _Description_ Asserts that a number value is not less than a specified minimum value.
* _Param_ {number} expected The minimum allowable value.
* _Throws_ {ValidationError} if the received value is less than the expected minimum value.
* _Example_
```typescript
 const schema = number().custom(min(10));
 parseOrFail(schema, 11);  // Valid
 parseOrFail(schema, 10);  // Valid
 parseOrFail(schema, 9);   // Throws an error: 'The received value is less than expected'
```
* _See_ Error Translation Key = 'n:min'
        
        
##### minExcluded (number)
        
```typescript
import { minExcluded } from 'bguard/number/minExcluded';
```
        
* _Description_ Asserts that a number value is strictly greater than a specified minimum value (i.e., the minimum value is excluded).
* _Param_ {number} expected The minimum allowable value, which is excluded.
* _Throws_ {ValidationError} if the received value is less than or equal to the expected minimum value.
* _Example_
```typescript
 const schema = number().custom(minExcluded(10));
 parseOrFail(schema, 11);  // Valid
 parseOrFail(schema, 10); // Throws an error: 'The received value is less than or equal to expected'
 parseOrFail(schema, 9);  // Throws an error: 'The received value is less than or equal to expected'
```
* _See_ Error Translation Key = 'n:minExcluded'
        
        
##### negative (number)
        
```typescript
import { negative } from 'bguard/number/negative';
```
        
* _Description_ Asserts that a number value is negative (less than zero).
* _Throws_ {ValidationError} if the received value is not negative.
* _Example_
```typescript
 const schema = number().custom(negative());
 parseOrFail(schema, -10); // Valid
 parseOrFail(schema, 0);  // Throws an error: 'The received value is not a negative number'
 parseOrFail(schema, 5);  // Throws an error: 'The received value is not a negative number'
```
* _See_ - Error Translation Key = 'n:negative'
        
        
##### positive (number)
        
```typescript
import { positive } from 'bguard/number/positive';
```
        
* _Description_ Asserts that a number value is positive (greater than zero).
* _Throws_ {ValidationError} if the received value is not positive.
* _Example_
```typescript
 const schema = number().custom(positive());
 parseOrFail(schema, 10);  // Valid
 parseOrFail(schema, 0);  // Throws an error: 'The received value is not a positive number'
 parseOrFail(schema, -5); // Throws an error: 'The received value is not a positive number'
```
* _See_ Error Translation Key = 'n:positive'
        
#### string
        
##### atLeastOneDigit (string)
        
```typescript
import { atLeastOneDigit } from 'bguard/string/atLeastOneDigit';
```
        
* _Description_ Asserts that a string value contains at least one digit.
* _Throws_ {ValidationError} if the received value does not contain at least one digit.
* _Example_
```typescript
 const schema = string().custom(atLeastOneDigit());
 parseOrFail(schema, 'abc123'); // Valid
 parseOrFail(schema, 'abcdef'); // Throws an error: 'The received value does not contain at least one digit'
```
* _See_ Error Translation Key = 's:atLeastOneDigit'
        
        
##### atLeastOneLowerChar (string)
        
```typescript
import { atLeastOneLowerChar } from 'bguard/string/atLeastOneLowerChar';
```
        
* _Description_ Asserts that a string value contains at least one lowercase character.
* _Throws_ {ValidationError} if the received value does not contain at least one lowercase character.
* _Example_
```typescript
 const schema = string().custom(atLeastOneLowerChar());
 parseOrFail(schema, 'abcDEF'); // Valid
 parseOrFail(schema, 'ABCDEF'); // Throws an error: 'The received value does not contain at least one lowercase character'
```
* _See_ Error Translation Key = 's:atLeastOneLowerChar'
        
        
##### atLeastOneSpecialChar (string)
        
```typescript
import { atLeastOneSpecialChar } from 'bguard/string/atLeastOneSpecialChar';
```
        
* _Description_ Asserts that a string value contains at least one special character.
* _Param_ {string} [allowedSpecialChars=* '@!#%&()^~{}'] The string containing allowed special characters. Defaults to '*@!#%&()^~{}'.
* _Throws_ {ValidationError} if the received value does not contain at least one of the allowed special characters.
* _Example_
```typescript
 const schema = string().custom(atLeastOneSpecialChar()); // Default special characters
 parseOrFail(schema, 'abc!def'); // Valid
 parseOrFail(schema, 'abcdef');  // Throws an error: 'The received value does not contain at least one special character'

 const customSchema = string().custom(atLeastOneSpecialChar('@$')); // Custom special characters
 parseOrFail(customSchema, 'abc@def'); // Valid
 parseOrFail(customSchema, 'abcdef');  // Throws an error: 'The received value does not contain at least one special character'
```
* _See_ Error Translation Key = 's:atLeastOneSpecialChar'
        
        
##### atLeastOneUpperChar (string)
        
```typescript
import { atLeastOneUpperChar } from 'bguard/string/atLeastOneUpperChar';
```
        
* _Description_ Asserts that a string value contains at least one uppercase character.
* _Throws_ {ValidationError} if the received value does not contain at least one uppercase character.
* _Example_
```typescript
 const schema = string().custom(atLeastOneUpperChar());
 parseOrFail(schema, 'abcDEF'); // Valid
 parseOrFail(schema, 'abcdef'); // Throws an error: 'The received value does not contain at least one uppercase character'
```
* _See_ Error Translation Key = 's:atLeastOneUpperChar'
        
        
##### contains (string)
        
```typescript
import { contains } from 'bguard/string/contains';
```
        
* _Description_ Asserts that a string value contains a specified substring.
* _Param_ {string} substring The substring that must be present in the string value.
* _Throws_ {ValidationError} if the received value does not contain the required substring.
* _Example_
```typescript
 const schema = string().custom(contains('foo'));
 parseOrFail(schema, 'foobar'); // Valid
 parseOrFail(schema, 'bar'); // Throws an error: 'The received value does not contain the required substring'
```
* _See_ Error Translation Key = 's:contains'
        
        
##### email (string)
        
```typescript
import { email } from 'bguard/string/email';
```
        
* _Description_ Asserts that a string value matches the email pattern. The pattern checks for a basic email format.
* _Throws_ {ValidationError} if the received value does not match the email pattern.
* _Example_
```typescript
 const schema = string().custom(email());
 parseOrFail(schema, 'example@example.com'); // Valid
 parseOrFail(schema, 'invalid-email');      // Throws an error: 'The received value does not match the required email pattern'
```
* _See_ - Error Translation Key = 's:email'
        
        
##### endsWith (string)
        
```typescript
import { endsWith } from 'bguard/string/endsWith';
```
        
* _Description_ Asserts that a string value ends with a specified substring.
* _Param_ {string} substring The substring that the string value must end with.
* _Throws_ {ValidationError} if the received value does not end with the required substring.
* _Example_
```typescript
 const schema = string().custom(endsWith('bar'));
 parseOrFail(schema, 'foobar'); // Valid
 parseOrFail(schema, 'foofoo'); // Throws an error: 'The received value does not end with the required substring'
```
* _See_ Error Translation Key = 's:endsWith'
        
        
##### lowerCase (string)
        
```typescript
import { lowerCase } from 'bguard/string/lowerCase';
```
        
* _Description_ Asserts that a string value is in lowercase.
* _Throws_ {ValidationError} if the received value is not in lowercase.
* _Example_
```typescript
 const schema = string().custom(lowerCase());
 parseOrFail(schema, 'valid');   // Valid
 parseOrFail(schema, 'Invalid'); // Throws an error: 'The received value is not in lowercase'
```
* _See_ Error Translation Key = 's:lowerCase'
        
        
##### maxLength (string)
        
```typescript
import { maxLength } from 'bguard/string/maxLength';
```
        
* _Description_ Asserts that the length of a string value is not greater than a specified maximum length.
* _Param_ {number} expected The maximum allowed length for the string.
* _Throws_ {ValidationError} if the length of the received value is greater than the expected length.
* _Example_
```typescript
 const schema = string().custom(maxLength(10));
 parseOrFail(schema, 'short');   // Valid
 parseOrFail(schema, 'this is a very long string'); // Throws an error: 'The received value length is greater than expected'
```
* _See_ Error Translation Key = 's:maxLength'
        
        
##### minLength (string)
        
```typescript
import { minLength } from 'bguard/string/minLength';
```
        
* _Description_ Asserts that the length of a string value is not less than a specified minimum length.
* _Param_ {number} expected The minimum required length for the string.
* _Throws_ {ValidationError} if the length of the received value is less than the expected length.
* _Example_
```typescript
 const schema = string().custom(minLength(5));
 parseOrFail(schema, 'short');    // Throws an error: 'The received value length is less than expected'
 parseOrFail(schema, 'adequate'); // Valid
```
* _See_ Error Translation Key = 's:minLength'
        
        
##### regExp (string)
        
```typescript
import { regExp } from 'bguard/string/regExp';
```
        
* _Description_ Asserts that a string value matches a specified regular expression pattern.
* _Param_ {RegExp} expected The regular expression pattern that the string value should match.
* _Throws_ {ValidationError} if the received value does not match the expected pattern.
* _Example_
```typescript
 const schema = string().custom(regExp(/^[A-Za-z0-9]+$/)); // Validates against alphanumeric pattern
 parseOrFail(schema, 'valid123');   // Valid
 parseOrFail(schema, 'invalid!@#'); // Throws an error: 'The received value does not match the required text pattern'
```
* _See_ Error Translation Key = 's:regExp'
        
        
##### startsWith (string)
        
```typescript
import { startsWith } from 'bguard/string/startsWith';
```
        
* _Description_ Asserts that a string value starts with a specified substring.
* _Param_ {string} substring The substring that the string value must start with.
* _Throws_ {ValidationError} if the received value does not start with the required substring.
* _Example_
```typescript
 const schema = string().custom(startsWith('foo'));
 parseOrFail(schema, 'foobar'); // Valid
 parseOrFail(schema, 'barfoo'); // Throws an error: 'The received value does not start with the required substring'
```
* _See_ Error Translation Key = 's:startsWith'
        
        
##### upperCase (string)
        
```typescript
import { upperCase } from 'bguard/string/upperCase';
```
        
* _Description_ Asserts that a string value is entirely in uppercase.
* _Throws_ {ValidationError} if the received value is not in uppercase.
* _Example_
```typescript
 const schema = string().custom(upperCase());
 parseOrFail(schema, 'VALID');    // Valid
 parseOrFail(schema, 'INVALID');  // Throws an error: 'The received value is not in uppercase'
 parseOrFail(schema, 'Valid');    // Throws an error: 'The received value is not in uppercase'
```
* _See_ Error Translation Key = 's:upperCase'
        
        
##### uuid (string)
        
```typescript
import { uuid } from 'bguard/string/uuid';
```
        
* _Description_ Asserts that a string value matches the UUID format.
* _Throws_ {ValidationError} if the received value is not a valid UUID.
* _Example_
```typescript
 const schema = string().custom(uuid());
 parseOrFail(schema, '123e4567-e89b-12d3-a456-426614174000'); // Valid
 parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID'
```
* _See_ Error Translation Key = 's:uuid'
        
        
##### uuidV1 (string)
        
```typescript
import { uuidV1 } from 'bguard/string/uuidV1';
```
        
* _Description_ Asserts that a string value matches the UUID v1 format.
* _Throws_ {ValidationError} if the received value is not a valid UUID v1.
* _Example_
```typescript
 const schema = string().custom(uuidV1());
 parseOrFail(schema, '550e8400-e29b-11d4-a716-446655440000'); // Valid
 parseOrFail(schema, '550e8400-e29b-21d4-a716-446655440000'); // Throws an error: 'The received value is not a valid UUID v1'
 parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v1'
```
* _See_ Error Translation Key = 's:uuidV1'
        
        
##### uuidV2 (string)
        
```typescript
import { uuidV2 } from 'bguard/string/uuidV2';
```
        
* _Description_ Asserts that a string value matches the UUID v2 format.
* _Throws_ {ValidationError} if the received value is not a valid UUID v2.
* _Example_
```typescript
 const schema = string().custom(uuidV2());
 parseOrFail(schema, '550e8400-e29b-21d4-a716-446655440000'); // Valid
 parseOrFail(schema, '550e8400-e29b-31d4-d716-446655440000'); // Throws an error: 'The received value is not a valid UUID v2'
 parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v2'
```
* _See_ Error Translation Key = 's:uuidV2'
        
        
##### uuidV3 (string)
        
```typescript
import { uuidV3 } from 'bguard/string/uuidV3';
```
        
* _Description_ Asserts that a string value matches the UUID v3 format.
* _Throws_ {ValidationError} if the received value is not a valid UUID v3.
* _Example_
```typescript
 const schema = string().custom(uuidV3());
 parseOrFail(schema, '550e8400-e29b-38d1-a456-426614174000'); // Valid
 parseOrFail(schema, '550e8400-e29b-28d1-a456-426614174000'); // Throws an error: 'The received value is not a valid UUID v3'
 parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v3'
```
* _See_ Error Translation Key = 's:uuidV3'
        
        
##### uuidV4 (string)
        
```typescript
import { uuidV4 } from 'bguard/string/uuidV4';
```
        
* _Description_ Asserts that a string value matches the UUID v4 format.
* _Throws_ {ValidationError} if the received value is not a valid UUID v4.
* _Example_
```typescript
 const schema = string().custom(uuidV4());
 parseOrFail(schema, '123e4567-e89b-42d3-a456-426614174000'); // Valid
 parseOrFail(schema, '123e4567-e89b-12d3-a456-426614174000'); // Throws an error: 'The received value is not a valid UUID v4'
 parseOrFail(schema, '123e4567-e89b-a2d3-a456-426614174000'); // Throws an error: 'The received value is not a valid UUID v4'
 parseOrFail(schema, '123e4567-e89b-42d3-c456-426614174000'); // Throws an error: 'The received value is not a valid UUID v4'
 parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v4'
```
* _See_ Error Translation Key = 's:uuidV4'
        
        
##### uuidV5 (string)
        
```typescript
import { uuidV5 } from 'bguard/string/uuidV5';
```
        
* _Description_ Asserts that a string value matches the UUID v5 format.
* _Throws_ {ValidationError} if the received value is not a valid UUID v5.
* _Example_
```typescript
 const schema = string().custom(uuidV5());
 parseOrFail(schema, '550e8400-e29b-51d4-a716-446655440000'); // Valid
 parseOrFail(schema, '550e8400-e29b-41d4-a716-446655440000'); // Throws an error: 'The received value is not a valid UUID v5'
 parseOrFail(schema, 'invalid-uuid'); // Throws an error: 'The received value is not a valid UUID v5'
```
* _See_ Error Translation Key = 's:uuidV5'
        
        
##### validUrl (string)
        
```typescript
import { validUrl } from 'bguard/string/validUrl';
```
        
* _Description_ Asserts that the string value is a valid URL with optional protocol validation.
* _Param_ {string} [protocol] The protocol that the URL must start with (e.g., 'http'). If not provided, any URL starting with 'http://' or 'https://' is considered valid.
* _Throws_ {ValidationError} if the received value does not match the expected URL pattern.
* _Example_
```typescript
 const schema = string().custom(validUrl()); // Validates any URL starting with 'http://' or 'https://'
 parseOrFail(schema, 'http://example.com'); // Valid
 parseOrFail(schema, 'https://example.com'); // Valid
 parseOrFail(schema, 'ftp://example.com');   // Throws an error
 parseOrFail(schema, 'http:example.com');    // Throws an error
```
* _See_ Error Translation Key = 's:url'
        
### Contributing
Contributions are welcome! Please open an issue or submit a pull request for any bugs or feature requests.
