## Custom Assert Documentation 

### array

### bigint

### boolean

### function

### mix

        
#### equalTo
        
```typescript
import { equalTo } from 'bguard/mix/equalTo';
```
        
Creates a custom assertion that checks if a value is equal to the expected value.

 This assertion can be used within a `.custom` method to enforce that a value strictly matches the expected value.
 It will throw a `ValidationError` if the values are not equal.

 * _Param_ {unknown} expected - The value that the received value is expected to match.
 * _Returns_ {RequiredValidation} A function that takes the received value and the path to the error,
 and throws a `ValidationError` if the received value does not equal the expected value.

 * _Throws_ {ValidationError} If the received value does not match the expected value.

 * _Example_
```typescript
 import { number, equalTo } from 'bguard';

 // Define a schema with a custom assertion
 const schema = number().custom(equalTo(5));

 parseOrFail(schema, 5); // Valid
 parseOrFail(schema, 3); // Throws an error: 'The received value is not equal to expected'
```
 * _See_ - Error Translation Key = 'm:equalTo'
        

        
### number

        
#### max
        
```typescript
import { max } from 'bguard/number/max';
```
        
* _Description_ Asserts that a number value does not exceed a specified maximum value.

 * _Param_ {number} expected The maximum allowable value.
 * _Returns_ {RequiredValidation} A validation function that takes a received number and a path to the error message. Throws an error if the received value exceeds the expected maximum value.

 * _Example_
```typescript
 const schema = number().custom(max(100));
 parseOrFail(schema, 99);  // Valid
 parseOrFail(schema, 100); // Valid
 parseOrFail(schema, 101); // Throws an error: 'The received value is greater than expected'
```
 * _See_ Error Translation Key = 'n:max'
        

        
        
#### maxExcluded
        
```typescript
import { maxExcluded } from 'bguard/number/maxExcluded';
```
        
* _Description_ - Asserts that a number value is strictly less than a specified maximum value (i.e., the maximum value is excluded).

 * _Param_ {number} expected - The maximum allowable value, which is excluded.
 * _Returns_ {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is greater than or equal to the expected maximum value.

 * _Example_
```typescript
 const schema = number().custom(maxExcluded(100));
 parseOrFail(schema, 99);  // Valid
 parseOrFail(schema, 100); // Throws an error: 'The received value is greater than or equal to expected'
 parseOrFail(schema, 101); // Throws an error: 'The received value is greater than or equal to expected'
```
 * _See_ - Error Translation Key = 'n:maxExcluded'
        

        
        
#### min
        
```typescript
import { min } from 'bguard/number/min';
```
        
* _Description_ - Asserts that a number value is not less than a specified minimum value.

 * _Param_ {number} expected - The minimum allowable value.
 * _Returns_ {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is less than the expected minimum value.

 * _Example_
```typescript
 const schema = number().custom(min(10));
 parseOrFail(schema, 11);  // Valid
 parseOrFail(schema, 10);  // Valid
 parseOrFail(schema, 9);   // Throws an error: 'The received value is less than expected'
```
 * _See_ - Error Translation Key = 'n:min'
        

        
        
#### minExcluded
        
```typescript
import { minExcluded } from 'bguard/number/minExcluded';
```
        
* _Description_ - Asserts that a number value is strictly greater than a specified minimum value (i.e., the minimum value is excluded).

 * _Param_ {number} expected - The minimum allowable value, which is excluded.
 * _Returns_ {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is less than or equal to the expected minimum value.

 * _Example_
```typescript
 const schema = number().custom(minExcluded(10));
 parseOrFail(schema, 11);  // Valid
 parseOrFail(schema, 10); // Throws an error: 'The received value is less than or equal to expected'
 parseOrFail(schema, 9);  // Throws an error: 'The received value is less than or equal to expected'
```
 * _See_ - Error Translation Key = 'n:minExcluded'
        

        
        
#### negative
        
```typescript
import { negative } from 'bguard/number/negative';
```
        
* _Description_ - Asserts that a number value is negative (less than zero).

 * _Returns_ {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is not negative.

 * _Example_
```typescript
 const schema = number().custom(negative());
 parseOrFail(schema, -10); // Valid
 parseOrFail(schema, 0);  // Throws an error: 'The received value is not a negative number'
 parseOrFail(schema, 5);  // Throws an error: 'The received value is not a negative number'
```
 * _See_ - Error Translation Key = 'n:negative'
        

        
        
#### positive
        
```typescript
import { positive } from 'bguard/number/positive';
```
        
* _Description_ - Asserts that a number value is positive (greater than zero).

 * _Returns_ {RequiredValidation} - A validation function that takes a received number and a path to the error message. Throws an error if the received value is not positive.

 * _Example_
```typescript
 const schema = number().custom(positive());
 parseOrFail(schema, 10);  // Valid
 parseOrFail(schema, 0);  // Throws an error: 'The received value is not a positive number'
 parseOrFail(schema, -5); // Throws an error: 'The received value is not a positive number'
```
 * _See_ - Error Translation Key = 'n:positive'
        

        
### object

### string

        
#### email
        
```typescript
import { email } from 'bguard/string/email';
```
        
* _Description_ Asserts that a string value matches the email pattern. The pattern checks for a basic email format.

 * _Throws_ an error if the received value does not match the email pattern.
 
 * _Example_
const schema = string().custom(email());
 parseOrFail(schema, 'example@example.com'); // Valid
 parseOrFail(schema, 'invalid-email');      // Throws an error: 'The received value does not match the required email pattern'
        

        
        
#### maxLength
        
```typescript
import { maxLength } from 'bguard/string/maxLength';
```
        
Asserts that the length of a string value is not greater than a specified maximum length.

 * _Param_ {number} expected - The maximum allowed length for the string.
 * _Returns_ {RequiredValidation} - A validation function that takes a received string and a path to the error message. Throws an error if the length of the received value is greater than the expected length.

 * _Example_
const schema = string().custom(maxLength(10));
 parseOrFail(schema, 'short');   // Valid
 parseOrFail(schema, 'this is a very long string'); // Throws an error: 'The received value length is greater than expected'
        

        
        
#### minLength
        
```typescript
import { minLength } from 'bguard/string/minLength';
```
        
Asserts that the length of a string value is not less than a specified minimum length.

 * _Param_ {number} expected - The minimum required length for the string.
 * _Returns_ {RequiredValidation} - A validation function that takes a received string and a path to the error message. Throws an error if the length of the received value is less than the expected length.

 * _Example_
const schema = string().custom(minLength(5));
 parseOrFail(schema, 'short');   // Throws an error: 'The received value length is less than expected'
 parseOrFail(schema, 'adequate'); // Valid
        

        
        
#### regExp
        
```typescript
import { regExp } from 'bguard/string/regExp';
```
        
Asserts that a string value matches a specified regular expression pattern.

 * _Param_ {RegExp} expected - The regular expression pattern that the string value should match.
 * _Returns_ {RequiredValidation} - A validation function that takes a received string and a path to the error message. Throws an error if the received value does not match the expected pattern.

 * _Example_
const schema = string().custom(regExp(/^[A-Za-z0-9]+$/)); // Validates against alphanumeric pattern
 parseOrFail(schema, 'valid123'); // Valid
 parseOrFail(schema, 'invalid!@#'); // Throws an error: 'The received value does not match the required text pattern'
        

        
### symbol
