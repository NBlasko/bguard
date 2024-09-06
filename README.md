# bguard

**bguard** is a powerful, flexible, and type-safe validation library for TypeScript. It allows developers to define validation schemas for their data structures and ensures that data conforms to the expected types and constraints.

![Coveralls branch](https://img.shields.io/coverallsCoverage/github/NBlasko/bguard) ![npm](https://img.shields.io/npm/dt/bguard) ![Known Vulnerabilities](https://snyk.io/test/github/NBlasko/bguard/badge.svg)

Table of contents

 * [Features](#h3_features)
 * [Installation](#h3_installation)
 * [Usage](#h3_usage)
    * [Defining a Schema](#h4_usage_defining_a_schema)
    * [Inferring TypeScript Types](#h4_usage_inferring_typescript_types)
    * [Generating TypeScript Types with `codeGen`](#h4_usage_generating_typescript_types_with_codegen)
    * [Generating Named TypeScript Types with `codeGenWithName`](#h4_usage_generating_typescript_types_with_codegenwithname)
    * [Summary:](#h4_usage_summary)
 * [Validating Data](#h3_validating_data)
    * [`parse` Method](#h4_validating_data_parse)
    * [`parseOrFail` Method](#h4_validating_data_parseorfail)
 * [Chaining Methods](#h3_chaining_methods)
    * [nullable()](#h4_chaining_nullable)
    * [optional()](#h4_chaining_optional)
    * [id(value: string)](#h4_chaining_id)
    * [description(value: string)](#h4_chaining_description)
 * [Literals](#h3_literals)
 * [Custom (Library Built-in) Assertions](#h3_custom_builtin_assertions)
 * [Create Custom Assertions](#h3_create_custom_assertions)
 * [Translation](#translation)
    * [Using Translations](#h4_using_translation)
    * [Common and Custom Translations](#common_and_custom_translations)

 * [Built-in Custom Assert Documentation](#builtin_custom_assert_documentation) 

     * [string](#assertdir_string)
          * [atLeastOneDigit](#assert_atleastonedigit_string)
          * [atLeastOneLowerChar](#assert_atleastonelowerchar_string)
          * [atLeastOneSpecialChar](#assert_atleastonespecialchar_string)
          * [atLeastOneUpperChar](#assert_atleastoneupperchar_string)
          * [contains](#assert_contains_string)
          * [email](#assert_email_string)
          * [endsWith](#assert_endswith_string)
          * [isValidDate](#assert_isvaliddate_string)
          * [isValidDateTime](#assert_isvaliddatetime_string)
          * [isValidTime](#assert_isvalidtime_string)
          * [lowerCase](#assert_lowercase_string)
          * [maxLength](#assert_maxlength_string)
          * [minLength](#assert_minlength_string)
          * [regExp](#assert_regexp_string)
          * [startsWith](#assert_startswith_string)
          * [upperCase](#assert_uppercase_string)
          * [uuid](#assert_uuid_string)
          * [uuidV1](#assert_uuidv1_string)
          * [uuidV2](#assert_uuidv2_string)
          * [uuidV3](#assert_uuidv3_string)
          * [uuidV4](#assert_uuidv4_string)
          * [uuidV5](#assert_uuidv5_string)
          * [validUrl](#assert_validurl_string)
     * [number](#assertdir_number)
          * [max](#assert_max_number)
          * [maxExcluded](#assert_maxexcluded_number)
          * [min](#assert_min_number)
          * [minExcluded](#assert_minexcluded_number)
          * [negative](#assert_negative_number)
          * [positive](#assert_positive_number)
     * [array](#assertdir_array)
          * [maxArrayLength](#assert_maxarraylength_array)
          * [minArrayLength](#assert_minarraylength_array)
     * [bigint](#assertdir_bigint)
          * [bigintMax](#assert_bigintmax_bigint)
          * [bigintMaxExcluded](#assert_bigintmaxexcluded_bigint)
          * [bigintMin](#assert_bigintmin_bigint)
          * [bigintMinExcluded](#assert_bigintminexcluded_bigint)
     * [date](#assertdir_date)
          * [dateMax](#assert_datemax_date)
          * [dateMin](#assert_datemin_date)
     * [mix](#assertdir_mix)
          * [equalTo](#assert_equalto_mix)
          * [oneOfValues](#assert_oneofvalues_mix)
     * [object](#assertdir_object)
          * [maxKeys](#assert_maxkeys_object)

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

#### <a id="h4_usage_generating_typescript_types_with_codegen"> Generating TypeScript Types with `codeGen` </a>

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

#### <a id="h4_usage_generating_typescript_types_with_codegenwithname"> Generating Named TypeScript Types with `codeGenWithName` </a>

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

#### <a id="h4_validating_data_parseorfail"> `parseOrFail` Method </a>

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
import { ExceptionContext, RequiredValidation } from 'bguard/ExceptionContext';
import { setToDefaultLocale } from 'bguard/translationMap';

const minLengthErrorMessage = 'The received value {{r}} is shorter than the expected length {{e}}';
const minLengthErrorKey = 'customPrefix:minLength';

export const minLength =
  (expected: number): RequiredValidation =>
  (received: string, ctx: ExceptionContext) => {
    if (received.length < expected) {
      ctx.addIssue(expected, received, minLengthErrorKey);
    }
  };

minLength.key = minLengthErrorKey;
minLength.message = minLengthErrorMessage;
setToDefaultLocale(minLength);
```

Explanation

- Error Key (`minLength.key`): This key (`'customPrefix:minLength'`) uniquely identifies the validation and is used for mapping error messages, especially when supporting multiple languages. It's essential to avoid collisions with built-in assertions, which use prefixes like `s:`, `n:`, and `b:` etc. More on that in [Common and Custom Translations](#common_and_custom_translations).

- Error Message (`minLength.message`): The message supports [interpolation](#translation), where `{{e}}` will be replaced by the expected value, and `{{r}}` will be replaced by the received value during validation .

- Exception Handling (`ctx.addIssue`): This method is responsible for throwing the error when the validation fails.

- Localization Support (`setToDefaultLocale`): This function registers the default error message with its associated key. If you later decide to support multiple languages, you can easily map this key to different messages.

 - Using `ctx.ref` to Reference Other Properties: The `ctx.ref` method allows you to reference other properties in the input object during validation. Method ctx.ref can access nested properties by passing a string that references them, with each level of nesting separated by a dot (.). However, it's important to note that `ctx.ref` retrieves the <b>original</b> value from the object before any transformations (e.g., `transformBeforeValidation`). This ensures that validations based on cross-property references work consistently, regardless of any transformations applied before validation.
 ```typescript
const loginSchema = object({
  password: string().custom(minLength(8)),
  confirmPassword: string().custom((received, ctx) => {
    if (received !== ctx.ref('password')) {
      ctx.addIssue(ctx.ref('password'), received, 'Not equal to password');
    }
  })
});

```

- Key Points for Developers:

  1. Always create unique error keys for custom validations to avoid potential conflicts with Bguard's built-in validations.
  2. Custom validations should use prefixes other than `s:`, `n:`, `b:`, and similar ones reserved for Bguard's internal validations.
  3. The `minLengthErrorMessage` serves as the default message. If you want to provide translations, you can do so by mapping the error key in the translationMap.
     For single-language applications, you can override the default message by directly passing your custom message to `addIssue` method.
  4. If we have a nested object { foo: { bar: 'baz' } }, we should use `ctx.ref('foo.bar')` to access the value 'baz' in custom assertions.
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
'c:optional': 'The required value is missing',
'c:nullable': 'Value should not be null',
'c:array': 'Expected an array but received a different type',
'c:objectType': 'Expected an object but received a different type',
'c:objectTypeAsArray': 'Expected an object but received an array. Invalid type of data',
'c:unrecognizedProperty': 'This property is not allowed in the object',
'c:requiredProperty': 'Missing required property in the object',
'c:invalidType': 'Invalid type of data',
'c:isBoolean': 'The received value is not {{e}}',
'c:date': 'The received value is not a valid instance of Date',
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
### <a id="builtin_custom_assert_documentation"> Built-in Custom Assert Documentation </a> 

#### <a id="assertdir_string"> string </a>
   
 <b>Prerequisites</b>
   
```typescript
import { string } from 'bguard/string';
```
   
* _Description_ Creates a new schema for validating string values.
* _Example_
```typescript
 const schema = string();
 parseOrFail(schema, 'hello'); // Validates successfully
 parseOrFail(schema, 123); // Throws a validation error
```
   
        
##### <a id="assert_atleastonedigit_string"> atLeastOneDigit </a>
        
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
        
        
##### <a id="assert_atleastonelowerchar_string"> atLeastOneLowerChar </a>
        
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
        
        
##### <a id="assert_atleastonespecialchar_string"> atLeastOneSpecialChar </a>
        
```typescript
import { atLeastOneSpecialChar } from 'bguard/string/atLeastOneSpecialChar';
```
        
* _Description_ Asserts that a string value contains at least one special character.
* _Param_ {string} [allowedSpecialChars=* '@$!#%&()^~{}'] The string containing allowed special characters. Defaults to '*@$!#%&()^~{}'.
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
        
        
##### <a id="assert_atleastoneupperchar_string"> atLeastOneUpperChar </a>
        
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
        
        
##### <a id="assert_contains_string"> contains </a>
        
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
        
        
##### <a id="assert_email_string"> email </a>
        
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
        
        
##### <a id="assert_endswith_string"> endsWith </a>
        
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
        
        
##### <a id="assert_isvaliddate_string"> isValidDate </a>
        
```typescript
import { isValidDate } from 'bguard/string/isValidDate';
```
        
* _Description_ Asserts that a string is a valid date in the format YYYY-MM-DD.
* _Throws_ {ValidationError} if the received string is not a valid date.
* _Example_
```typescript
 const schema = string().custom(isValidDate());
 parseOrFail(schema, "2020-01-01"); // Valid
 parseOrFail(schema, "2020-1-1");   // Throws an error: 'The received value is not a valid date'
 parseOrFail(schema, "2020-01-32"); // Throws an error: 'The received value is not a valid date'
```
* _See_ Error Translation Key = 's:isValidDate'
        
        
##### <a id="assert_isvaliddatetime_string"> isValidDateTime </a>
        
```typescript
import { isValidDateTime } from 'bguard/string/isValidDateTime';
```
        
* _Description_ Asserts that a string value is a valid ISO 8601 datetime string.
* _Param_ {DateTimeOptions} options Options to control the validation:
 - `offset`: If `true`, allows timezone offsets in the datetime string.
 - `precision`: Specify the exact number of fractional second digits allowed (e.g., 3 for milliseconds).
* _Throws_ {ValidationError} if the received value is not a valid datetime string according to the options.
* _Example_
```typescript
 const schema = string().custom(isValidDateTime());
 parseOrFail(schema, "2024-01-01T00:00:00Z"); // Valid
 parseOrFail(schema, "2024-01-01T00:00:00.123Z"); // Valid
 parseOrFail(schema, "2024-01-01T00:00:00+03:00"); // Invalid (no offsets allowed)

 const schemaWithOffset = string().custom(isValidDateTime({ offset: true }));
 parseOrFail(schemaWithOffset, "2024-01-01T00:00:00+04:00"); // Valid

 const schemaWithPrecision = string().custom(isValidDateTime({ precision: 3 }));
 parseOrFail(schemaWithPrecision, "2024-01-01T00:00:00.123Z"); // Valid
 parseOrFail(schemaWithPrecision, "2024-01-01T00:00:00.123456Z"); // Invalid
```
* _See_ Error Translation Key = 's:isValidDateTime'
        
        
##### <a id="assert_isvalidtime_string"> isValidTime </a>
        
```typescript
import { isValidTime } from 'bguard/string/isValidTime';
```
        
* _Description_ Asserts that a string is a valid time in the format HH:mm:ss, with optional fractional seconds.
* _Param_ {IsValidTimeOptions} options Optional settings to configure the validation.
* _Throws_ {ValidationError} if the received string is not a valid time.
* _Example_
```typescript
 const schema = string().custom(isValidTime());
 parseOrFail(schema, "00:00:00"); // Valid
 parseOrFail(schema, "23:59:59.9999999"); // Valid
 parseOrFail(schema, "00:00:00.256Z");   // Throws an error: 'The received value is not a valid time'

 const schemaWithPrecision = string().custom(isValidTime({ precision: 3 }));
 parseOrFail(schemaWithPrecision, "00:00:00.256"); // Valid
 parseOrFail(schemaWithPrecision, "00:00:00");    // Throws an error: 'The received value is not a valid time'
```
* _See_ Error Translation Key = 's:isValidTime'
        
        
##### <a id="assert_lowercase_string"> lowerCase </a>
        
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
        
        
##### <a id="assert_maxlength_string"> maxLength </a>
        
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
        
        
##### <a id="assert_minlength_string"> minLength </a>
        
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
        
        
##### <a id="assert_regexp_string"> regExp </a>
        
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
        
        
##### <a id="assert_startswith_string"> startsWith </a>
        
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
        
        
##### <a id="assert_uppercase_string"> upperCase </a>
        
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
        
        
##### <a id="assert_uuid_string"> uuid </a>
        
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
        
        
##### <a id="assert_uuidv1_string"> uuidV1 </a>
        
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
        
        
##### <a id="assert_uuidv2_string"> uuidV2 </a>
        
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
        
        
##### <a id="assert_uuidv3_string"> uuidV3 </a>
        
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
        
        
##### <a id="assert_uuidv4_string"> uuidV4 </a>
        
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
        
        
##### <a id="assert_uuidv5_string"> uuidV5 </a>
        
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
        
        
##### <a id="assert_validurl_string"> validUrl </a>
        
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
        
#### <a id="assertdir_number"> number </a>
   
 <b>Prerequisites</b>
   
```typescript
import { number } from 'bguard/number';
```
   
* _Description_ Creates a new schema for validating number values.
* _Example_
```typescript
 const schema = number();
 parseOrFail(schema, 42); // Validates successfully
 parseOrFail(schema, '42'); // Throws a validation error
```
   
        
##### <a id="assert_max_number"> max </a>
        
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
        
        
##### <a id="assert_maxexcluded_number"> maxExcluded </a>
        
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
        
        
##### <a id="assert_min_number"> min </a>
        
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
        
        
##### <a id="assert_minexcluded_number"> minExcluded </a>
        
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
        
        
##### <a id="assert_negative_number"> negative </a>
        
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
        
        
##### <a id="assert_positive_number"> positive </a>
        
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
        
#### <a id="assertdir_array"> array </a>
   
 <b>Prerequisites</b>
   
```typescript
import { array } from 'bguard/array';
```
   
* _Description_ Creates a new schema for validating arrays where each element must match the specified schema.
 
* _Param_ {T} arraySchema - The schema that each element of the array must match.
* _Example_
```typescript
 const schema = array(string());
 parseOrFail(schema, ['hello', 'world']); // Validates successfully
 parseOrFail(schema, ['hello', 123]); // Throws a validation error
```
   
        
##### <a id="assert_maxarraylength_array"> maxArrayLength </a>
        
```typescript
import { maxArrayLength } from 'bguard/array/maxArrayLength';
```
        
* _Description_ Asserts that the length of an array is not greater than a specified maximum length.
* _Param_ {number} expected The maximum allowed length for the array.
* _Throws_ {ValidationError} if the length of the received value is greater than the expected length.
* _Example_
```typescript
 const schema = array(string()).custom(maxArrayLength(3));
 parseOrFail(schema, ['adequate', 'array']);   // Valid
 parseOrFail(schema, ['adequate', 'array', 'length']);   // Valid
 parseOrFail(schema, ['adequate', 'array', 'length', 'test']); // Throws an error: 'The received value length is greater than expected'
```
* _See_ Error Translation Key = 'a:maxArrayLength'
        
        
##### <a id="assert_minarraylength_array"> minArrayLength </a>
        
```typescript
import { minArrayLength } from 'bguard/array/minArrayLength';
```
        
* _Description_ Asserts that the length of na array is not less than a specified minimum length.
* _Param_ {number} expected The minimum required length for the array.
* _Throws_ {ValidationError} if the length of the received value is less than the expected length.
* _Example_
```typescript
 const schema = array(string()).custom(minArrayLength(3));
 parseOrFail(schema, ['short', 'array']);    // Throws an error: 'The received value length is less than expected'
 parseOrFail(schema, ['adequate', 'array', 'length']); // Valid
 parseOrFail(schema, ['adequate', 'array', 'length', 'test']); // Valid
```
* _See_ Error Translation Key = 'a:minArrayLength'
        
#### <a id="assertdir_bigint"> bigint </a>
   
 <b>Prerequisites</b>
   
```typescript
import { bigint } from 'bguard/bigint';
```
   
* _Description_ Creates a new schema for validating bigint values.
* _Example_
```typescript
 const schema = bigint();
 parseOrFail(schema, 42n); // Validates successfully
 parseOrFail(schema, 42); // Throws a validation error
 parseOrFail(schema, '42'); // Throws a validation error
```
   
        
##### <a id="assert_bigintmax_bigint"> bigintMax </a>
        
```typescript
import { bigintMax } from 'bguard/bigint/bigintMax';
```
        
* _Description_ Asserts that a bigint value does not exceed a specified maximum value.
* _Param_ {bigint} expected The maximum allowable value.
* _Throws_ {ValidationError} if the received value exceeds the expected maximum value.
* _Example_
```typescript
 const schema = bigint().custom(bigintMax(100n));
 parseOrFail(schema, 99n);  // Valid
 parseOrFail(schema, 100n); // Valid
 parseOrFail(schema, 101n); // Throws an error: 'The received value is greater than expected'
```
* _See_ Error Translation Key = 'bi:max'
        
        
##### <a id="assert_bigintmaxexcluded_bigint"> bigintMaxExcluded </a>
        
```typescript
import { bigintMaxExcluded } from 'bguard/bigint/bigintMaxExcluded';
```
        
* _Description_ - Asserts that a bigint value is strictly less than a specified maximum value (i.e., the maximum value is excluded).
* _Param_ {bigint} expected - The maximum allowable value, which is excluded.
* _Throws_ {ValidationError} if the received value is greater than or equal to the expected maximum value.
* _Example_
```typescript
 const schema = bigint().custom(bigintMaxExcluded(100n));
 parseOrFail(schema, 99n);  // Valid
 parseOrFail(schema, 100n); // Throws an error: 'The received value is greater than or equal to expected'
 parseOrFail(schema, 101n); // Throws an error: 'The received value is greater than or equal to expected'
```
* _See_ Error Translation Key = 'bi:maxExcluded'
        
        
##### <a id="assert_bigintmin_bigint"> bigintMin </a>
        
```typescript
import { bigintMin } from 'bguard/bigint/bigintMin';
```
        
* _Description_ Asserts that a bigint value is not less than a specified minimum value.
* _Param_ {bigint} expected The minimum allowable value.
* _Throws_ {ValidationError} if the received value is less than the expected minimum value.
* _Example_
```typescript
 const schema = bigint().custom(bigintMin(10n));
 parseOrFail(schema, 11n);  // Valid
 parseOrFail(schema, 10n);  // Valid
 parseOrFail(schema, 9n);   // Throws an error: 'The received value is less than expected'
```
* _See_ Error Translation Key = 'bi:min'
        
        
##### <a id="assert_bigintminexcluded_bigint"> bigintMinExcluded </a>
        
```typescript
import { bigintMinExcluded } from 'bguard/bigint/bigintMinExcluded';
```
        
* _Description_ Asserts that a bigint value is strictly greater than a specified minimum value (i.e., the minimum value is excluded).
* _Param_ {bigint} expected The minimum allowable value, which is excluded.
* _Throws_ {ValidationError} if the received value is less than or equal to the expected minimum value.
* _Example_
```typescript
 const schema = bigint().custom(bigintMinExcluded(10n));
 parseOrFail(schema, 11n);  // Valid
 parseOrFail(schema, 10n); // Throws an error: 'The received value is less than or equal to expected'
 parseOrFail(schema, 9n);  // Throws an error: 'The received value is less than or equal to expected'
```
* _See_ Error Translation Key = 'bi:minExcluded'
        
#### <a id="assertdir_date"> date </a>
   
 <b>Prerequisites</b>
   
```typescript
import { date } from 'bguard/date';
```
   
* _Description_ Creates a new schema for validating date values.
* _Example_
```typescript
 const schema = date();
 parseOrFail(schema, true); // Validates successfully
 parseOrFail(schema, 'true'); // Throws a validation error
```
   
        
##### <a id="assert_datemax_date"> dateMax </a>
        
```typescript
import { dateMax } from 'bguard/date/dateMax';
```
        
* _Description_ Asserts that a date value is not greater than a specified maximum value.
* _Param_ {Date | string} expected The maximum allowable value.
* _Throws_ {ValidationError} if the received value is greater than the expected maximum value.
* _Example_
```typescript
 const schema = date().custom(dateMax('2024-12-31'));
 parseOrFail(schema, new Date('2024-12-30'));  // Valid
 parseOrFail(schema, new Date('2024-12-31'));  // Valid
 parseOrFail(schema, new Date('2025-01-01'));  // Throws an error: 'The received value is greater than expected'
```
* _See_ Error Translation Key = 'dt:max'
        
        
##### <a id="assert_datemin_date"> dateMin </a>
        
```typescript
import { dateMin } from 'bguard/date/dateMin';
```
        
* _Description_ Asserts that a number value is not less than a specified minimum value.
* _Param_ {Date | string} expected The minimum allowable value.
* _Throws_ {ValidationError} if the received value is less than the expected minimum value.
* _Example_
```typescript
 const schema = date().custom(dateMin('2023-01-01'));
 parseOrFail(schema, new Date('2023-01-02'));  // Valid
 parseOrFail(schema, new Date('2023-01-01'));  // Valid
 parseOrFail(schema, new Date('2022-12-31'));  // Throws an error: 'The received value is less than expected'
```
* _See_ Error Translation Key = 'dt:min'
        
#### <a id="assertdir_mix"> mix </a>
   
 <b>Prerequisites</b>
   
```typescript
import { oneOfTypes } from 'bguard/mix';
```
   
* _Description_ Creates a new schema for validating values that can match any one of the specified primitive types.

 
* _Param_ {T} valueTypes - An array of primitive types that the value can match.
* _Example_
```typescript
 const schema = oneOfTypes(['string', 'number']);
 parseOrFail(schema, 'hello'); // Validates successfully
 parseOrFail(schema, 42); // Validates successfully
 parseOrFail(schema, true); // Throws a validation error
```
   
        
##### <a id="assert_equalto_mix"> equalTo </a>
        
```typescript
import { equalTo } from 'bguard/mix/equalTo';
```
        
* _Description_ Creates a custom assertion that checks if a value is equal to the expected value.
* > **Notice:** It has already been implemented in the number, bigint and string schema. There is no need to use it as a custom assert.
* _Param_ {unknown} expected The value that the received value is expected to match.
* _Throws_ {ValidationError} If the received value does not match the expected value.
* _Example_
```typescript
 const schema = number().custom(equalTo(5)); // Define a schema with a custom assertion
 parseOrFail(schema, 5); // Valid
 parseOrFail(schema, 3); // Throws an error: 'The received value is not equal to expected'
```
* _See_ Error Translation Key = 'm:equalTo'
        
        
##### <a id="assert_oneofvalues_mix"> oneOfValues </a>
        
```typescript
import { oneOfValues } from 'bguard/mix/oneOfValues';
```
        
* _Description_ Creates a custom assertion that checks if a value is equal to the one of expected values.
* > **Notice:** It has already been implemented in the number, bigint and string schema. There is no need to use it as a custom assert.
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
        
#### <a id="assertdir_object"> object </a>
   
 <b>Prerequisites</b>
   
```typescript
import { object } from 'bguard/object';
```
   
* _Description_ Creates a new schema for validating objects where each property must match the specified schema.
 
* _Param_ {T} shapeSchema - The schema that each property of the object must match.
* _Example_
```typescript
 const schema = object({
   name: string(),
   age: number()
 });
 parseOrFail(schema, { name: 'John', age: 30 }); // Validates successfully
 parseOrFail(schema, { name: 'John', age: '30' }); // Throws a validation error
```
   
        
##### <a id="assert_maxkeys_object"> maxKeys </a>
        
```typescript
import { maxKeys } from 'bguard/object/maxKeys';
```
        
* _Description_ Ensures that the object has no more than the specified number of keys.
* _Param_ {number} expected - The maximum number of keys allowed in the object.
* _Throws_ {ValidationError} if the number of the received keys is greater than the expected value.
* _Example_
```typescript
 const schema = object({
   name: string(),
   email: string(),
 })
   .allowUnrecognized()
   .custom(maxKeys(2));

 // This will pass
 parseOrFail(schema, { name: 'John', email: 'john@example.com' });

 // This will throw an error because there are 3 keys
 parseOrFail(schema, { name: 'John', email: 'john@example.com', address: '123 Main St' });
```
* _See_ Error Translation Key = 'o:maxKeys'
        
### Contributing
Contributions are welcome! Please open an issue or submit a pull request for any bugs or feature requests.