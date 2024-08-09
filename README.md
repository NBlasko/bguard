# bguard

**bguard** is a powerful, flexible, and type-safe validation library for TypeScript. It allows developers to define validation schemas for their data structures and ensures that data conforms to the expected types and constraints.

### Features

- **Type-Safe Validation**: Automatically infer TypeScript types from your validation schemas.
- **Customizable**: Easily extend the library with custom validation rules.
- **Nested Validation**: Supports complex data structures, including arrays and objects.
- **Optional and Nullable Support**: Fine-grained control over optional and nullable fields.
- **Lightweight**: No dependencies and optimized for performance.

### Installation

```bash
npm install bguard
```

### Usage

#### Defining a Schema
You can define a schema using the V function and chain methods to apply validation rules:

```typeScript
import { V, parseSchema } from 'bguard';
import { email } from 'bguard/asserts/string/email';
import { min } from 'bguard/asserts/number/min';

// Example: Student Schema
const studentSchema = V().object({
  email: V().string().optional().custom(email()),
  age: V().number().custom(min(18)),
  address: V().string().nullable(),
  classes: V().array(
  V().object({
      name: V().string(),
      mandatory: V().boolean(),
      rooms: V().array(V().number()),
    }).optional()
  ),
  verified: V().boolean().optional(),
});


// Parsing and validating data
const studentData = {
  email: 'student@example.com',
  age: 21,
  address: null,
  classes: [{ name: 'Math', mandatory: true, rooms: [101, 102] }],
};

try {
  const parsedData = parseSchema(studentSchema, studentData);
  console.log('Validation successful:', parsedData);
} catch (e) {
  console.error('Validation failed:', e);
}
```

#### Schema Inference

One of the key features of `bguard` is its ability to infer TypeScript types directly from your validation schemas. This ensures that your data is validated and correctly typed, minimizing runtime errors and improving code safety.

For example, consider the `studentSchema` defined earlier, we can infer the TypeScript type for this schema using the GetType utility:
```typeScript
import { V, parseSchema, GetType } from 'bguard';
import { email } from 'bguard/asserts/string/email';
import { min } from 'bguard/asserts/number/min';

// Example: Student Schema
const studentSchema = V().object({
  email: V().string().optional().custom(email()),
  age: V().number().custom(min(18)),
  address: V().string().nullable(),
  classes: V().array(
  V().object({
      name: V().string(),
      mandatory: V().boolean(),
      rooms: V().array(V().number()),
    }).optional()
  ),
  verified: V().boolean().optional(),
});

type StudentSchema = GetType<typeof studentSchema>;

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



### Extending bguard
`bguard` is designed to be extensible. You can create custom validation rules and add them to your schema definitions.

### API Reference

`V`
The main function to create validation schemas. Supports methods for primitive types (`string`, `number`, `boolean`), `arrays`, and `objects`.

`parseSchema(schema, value)`
Validates the value against the provided schema and returns the parsed, type-safe data if validation succeeds. Throws a ValidationError if validation fails.

### Contributing
Contributions are welcome! Please open an issue or submit a pull request for any bugs or feature requests.
