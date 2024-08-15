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

### Explanation

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
  `string().equalTo('myStringValue')` will infer 'myStringValue' as the type.

- Number Literals:
  `number().equalTo(42)` will infer 42 as the type.

- Boolean Literals:
  `boolean().onlyTrue()` will infer true as the type.
  `boolean().onlyFalse()` will infer false as the type.

### Custom Assertions

You can extend the validation with custom assertions:

```typeScript
import { min } from 'bguard/number/min';
import { max } from 'bguard/number/max';

const ageSchema = number().custom(min(18), max(120));
```

Assertions are imported from specific paths for better tree-shaking and smaller bundle sizes.

### Contributing

Contributions are welcome! Please open an issue or submit a pull request for any bugs or feature requests.
