# bguard

**bguard** is a powerful, flexible, and type-safe validation library for TypeScript. It allows developers to define validation schemas for their data structures and ensures that data conforms to the expected types and constraints.

![Coveralls branch](https://img.shields.io/coverallsCoverage/github/NBlasko/bguard) ![npm](https://img.shields.io/npm/dt/bguard) ![Known Vulnerabilities](https://snyk.io/test/github/NBlasko/bguard/badge.svg)

Table of contents

@@TABLE_OF_CONTENTS@@

### <a id="h3_features"> Features </a>

- **Type Inference**: Automatically infer TypeScript types from your validation schemas.
- **Custom Assertions**: Add custom validation logic for your schemas.
- **Chaining Methods**: Easily chain methods for complex validations.
- **Nested Validation**: Supports complex data structures, including arrays and objects.
- **Optional and Nullable Support**: Fine-grained control over optional and nullable fields.
- **Small Bundle Size**: Each assertion is in its own file, minimizing your final bundle size.
- **Lightweight**: No dependencies and optimized for performance.

### <a id="h3_installation"> Installation </a>

```bash
npm install bguard
```

### <a id="h3_usage"> Usage </a>

Here’s a basic example of how to use `bguard` to define and validate a schema.

#### <a id="h4_usage_defining_a_schema"> Defining a Schema </a>

Let's define a schema for a Student object:

```typeScript

import { InferType } from 'bguard';
import { object } from 'bguard/object';
import { array } from 'bguard/array';
import { number } from 'bguard/number';
import { string } from 'bguard/string';
import { boolean } from 'bguard/boolean';
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

#### <a id="h4_usage_inferring_typescript_types"> Inferring TypeScript Types </a>

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

#### <a id="h4_usage_generating_typescript_types_with_codeGen"> Generating TypeScript Types with `codeGen` </a>

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

> **Notice:** The returned string does not include a type name or the `=` symbol. You would need to add these manually if you want a complete type definition.

#### <a id="h4_usage_generating_typescript_types_with_codeGenWithName"> Generating Named TypeScript Types with `codeGenWithName` </a>

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
#### <a id="h4_usage_summary"> Summary: </a>

`codeGen(schema: CommonSchema): string` - Generates a string of the TypeScript type based on the schema. You need to manually add a type name and assignment if needed.

`codeGenWithName(typeName: string, schema: CommonSchema): string` - Generates a complete TypeScript type definition string, including the type keyword and type name.

### <a id="h3_validating_data"> Validating Data </a>

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

#### <a id="h4_validating_data_parse"> `parse` Method </a>

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

#### <a id="h4_validating_data_parseOrFail"> `parseOrFail` Method </a>

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

Explanation

- **`parse` Method**: This method returns a tuple where the first element is an array of validation errors (if any), and the second element is the successfully parsed value (or `undefined` if errors exist). It allows collecting all errors by setting the `getAllErrors` flag.

- **`parseOrFail` Method**: This method throws a `ValidationError` when the first validation rule fails, making it suitable for scenarios where early termination of validation is desired.

- **Options**: Both methods accept options for language settings and error collection, enhancing flexibility in handling validation processes.

### <a id="h3_chaining_methods"> Chaining Methods </a>

#### <a id="h4_chaining_nullable"> nullable() </a>

Allows the value to be `null`.

Example:

```typeScript
const nullableSchema = string().nullable().optional();
// This schema allows string or null values.
```

#### <a id="h4_chaining_optional"> optional() </a>
Allows the value to be `undefined`.

_Example_:

```typeScript
const optionalSchema = string().nullable().optional();
// This schema allows string or undefined values.
```

#### <a id="h4_chaining_default"> default(value: InferType<this>)</a>
Sets a default value if the received value is `undefined`. The default value must match the inferred type of the schema, ensuring compatibility.


> **Notice:** You cannot chain `default()` and `optional()` together, as they are contradictory. The `optional()` method allows the value to be `undefined`, while the `default()` method assigns a value if `undefined`. Attempting to chain both will throw a `BuildSchemaError` with the message: `"Cannot call method 'default' after method 'optional'"`.


> **Notice:** Additionally, `default()` must be the last method in the chain because it validates during schema build time that the default value is compatible with the rest of the schema. For example, if the schema is `number()`, the default value cannot be a `string`.

_Example_:

```typeScript
const schemaWithDefault = string().nullable().default('defaultString'); 
// This schema allows null values and sets 'defaultString' if the value is undefined.

const optionalSchema = string().nullable().optional();
// This schema allows both null and undefined values, but it does not provide a default value.
```
#### <a id="h4_chaining_id"> id(value: string) </a> 

Assigns a unique identifier to the schema, useful for tracking or mapping validation errors. The `id` can be accessed via `err.meta?.id` in case of a validation error.

#### <a id="h4_chaining_description"> description(value: string) </a> 

Provides a description for the schema, which can be used to give more context about the validation error. The `description` can be accessed via `err.meta?.description` in case of a validation error.

_Example_:

```typeScript
const addressSchema = string()
  .id('address')
  .description('Users address');
// This schema validates that string and assigns an ID and description for better error handling.

try {
  parseOrFail(addressSchema, undefined);
} catch (e) {
  const err = e as ValidationError;
  console.log(err.message);  // Output: 'The required value is missing'
  console.log(err.pathToError);  // Output: ''
  console.log(err.meta?.id);  // Output:  'address'
  console.log(err.meta?.description);  // Output: 'Users address'
}
```
#### <a id="h4_chaining_transformbeforevalidation"> transformBeforeValidation\<In\>(cb: TransformCallback<In, InferType\<Schema>\>) </a>

This method allows you to apply a transformation to the input value before any validation occurs. The transformation is applied before the schema's other methods (like `nullable`, `custom`, etc.). The callback function can receive an input of type `unknown` by default, but you can specify the type if you know it, such as `string`. The return value of the callback must be of the same type as the inferred type of the schema, ensuring that the overall type does not change.

<b>Order of Execution</b>: 
First, transformations specified using transformBeforeValidation are applied.
Then, the schema checks for null or undefined based on methods like `nullable` or `optional`.
Finally, the `custom` validations and type checks are performed.

This method is particularly useful for normalizing or preparing data before validation, such as trimming whitespace, converting empty strings to null, or handling other preprocessing needs.

> **Notice:** Like default, `transformBeforeValidation` should be placed at the end of the chain. This ensures that the transformation is correctly applied after all other type checks are resolved, preserving the expected type.

_Example_:

```typescript
const stringOrNullSchema = string()
  .nullable()
  .custom(minLength(3))
  .transformBeforeValidation((val) => val + '') // First, transform value to a string
  .transformBeforeValidation((val: string) => (val === '' ? null : val)); // Second, convert empty strings to null

// Parsing 'test' will pass as 'test' is a valid string longer than 3 characters.
parseOrFail(stringOrNullSchema, 'test');

// Parsing '' will be transformed to null and will pass due to .nullable().
parseOrFail(stringOrNullSchema, '');
```

### <a id="h3_literals"> Literals </a>

- <b>String Literals</b>:
  `string().equalTo('myStringValue')` will infer <b>'myStringValue'</b> as the type.
  `string().oneOfValues(['foo', 'bar'])` will infer <b>'foo' | 'bar'</b> as the type.

- <b>Number Literals</b>:
  `number().equalTo(42)` will infer <b>42</b> as the type.
  `number().oneOfValues([3, 5])` will infer <b>3 | 5</b> as the type.

- <b>Boolean Literals</b>:
  `boolean().onlyTrue()` will infer <b>true</b> as the type.
  `boolean().onlyFalse()` will infer <b>false</b> as the type.

### <a id="h3_custom_builtin_assertions"> Custom (Library Built-in) Assertions </a>

The `custom` method allows you to extend the validation schema with additional asserts. These asserts can either be user-defined or selected from the comprehensive set provided by the library. This flexibility ensures that you can tailor validations to meet specific requirements beyond the standard methods available.
All built-in asserts are documented in the [Built-in Custom Assert Documentation](#builtin_custom_assert_documentation) section.

Example

```typeScript
import { min } from 'bguard/number/min';
import { max } from 'bguard/number/max';

const ageSchema = number().custom(min(18), max(120));
```

Library built-in assertions are imported from specific paths for better tree-shaking and smaller bundle sizes.

### <a id="h3_create_custom_assertions"> Create Custom Assertions </a>

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

### <a id="translation"> Translation </a>

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

#### <a id="h4_using_translation"> Using Translations </a>

To apply the new translation, both `parse` and `parseOrFail` functions accept a lng property in the options object provided as the third parameter:

```typeScript
parseOrFail(testSchema, { foo: 4 }, { lng: 'SR' });
// or
parse(testSchema, { foo: 4 }, { lng: 'SR' });
```

#### <a id="common_and_custom_translations"> Common and Custom Translations </a>

We have two sets of translations: common errors and specific assertions.

<b>Common Error Translations</b>:

```
@@TRANSLATION_COMMON_MAP@@
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
- dt - date

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
