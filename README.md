# bguard

**bguard** is a powerful, flexible, and type-safe validation library for TypeScript. It allows developers to define validation schemas for their data structures and ensures that data conforms to the expected types and constraints.

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

import { parseSchema, InferType, string, number, array, object, boolean } from 'bguard';
import { email } from 'bguard/asserts/string/email';
import { min } from 'bguard/asserts/number/min';
import { max } from 'bguard/asserts/number/max';

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

#### Validating Data

To validate data against the defined schema, use the parseSchema function:

```typeScript

const studentData = {
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

const validatedData = parseSchema(studentSchema, studentData);


```

If the data does not conform to the schema, an error will be thrown.



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
import { min } from 'bguard/asserts/number/min';
import { max } from 'bguard/asserts/number/max';

const ageSchema = number().custom(min(18), max(120));
```
Assertions are imported from specific paths for better tree-shaking and smaller bundle sizes.

### Contributing
Contributions are welcome! Please open an issue or submit a pull request for any bugs or feature requests.
