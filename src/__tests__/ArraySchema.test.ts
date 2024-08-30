import { expectEqualTypes } from '../../jest/setup';
import { BuildSchemaError } from '../exceptions';
import { parseOrFail, InferType } from '../';
import { array } from '../asserts/array';
import { number } from '../asserts/number';
import { minArrayLength } from '../asserts/array/minArrayLength';
import { string } from '../asserts/string';
import { maxArrayLength } from '../asserts/array/maxArrayLength';

describe('ArraySchema', () => {
  it('should be an array', () => {
    const arrayOfNumbersSchema = array(number());
    expectEqualTypes<number[], InferType<typeof arrayOfNumbersSchema>>(true);
    const myArray = [1, 2, 3];
    expect(parseOrFail(arrayOfNumbersSchema, myArray)).toEqual(myArray);
    expect(() => parseOrFail(arrayOfNumbersSchema, 1)).toThrow('Expected an array but received a different type');
  });

  it('should not build with missing parameters', () => {
    //@ts-expect-error testing missing parameters in runtime
    const invalidArraySchemaFunction = () => array();
    expectEqualTypes<unknown[], InferType<ReturnType<typeof invalidArraySchemaFunction>>>(true);
    expect(invalidArraySchemaFunction).toThrow('Missing schema in array method');
    expect(invalidArraySchemaFunction).toThrow(BuildSchemaError);
  });

  it('should not build with invalid parameters', () => {
    //@ts-expect-error testing invalid schema in runtime
    const invalidArraySchemaFunction = () => array('not a bguard schema');
    expectEqualTypes<unknown[], InferType<ReturnType<typeof invalidArraySchemaFunction>>>(true);
    expect(invalidArraySchemaFunction).toThrow('Invalid schema in array method');
    expect(invalidArraySchemaFunction).toThrow(BuildSchemaError);
  });

  it('should be an array with minArrayLength of 3', () => {
    const textSchema = array(string()).custom(minArrayLength(3));
    expectEqualTypes<string[], InferType<typeof textSchema>>(true);
    const validArrayWithMore = ['adequate', 'array', 'length', 'test'];
    expect(parseOrFail(textSchema, validArrayWithMore)).toEqual(validArrayWithMore);
    const validArrayWithEqualTo = ['adequate', 'array', 'length'];
    expect(parseOrFail(textSchema, validArrayWithEqualTo)).toEqual(validArrayWithEqualTo);
    expect(() => parseOrFail(textSchema, ['short', 'array'])).toThrow(
      'The received value length is less than expected',
    );
  });

  it('should be an array with maxArrayLength of 3', () => {
    const textSchema = array(string()).custom(maxArrayLength(3));
    expectEqualTypes<string[], InferType<typeof textSchema>>(true);
    const validArrayWithLess = ['adequate', 'array'];
    expect(parseOrFail(textSchema, validArrayWithLess)).toEqual(validArrayWithLess);
    const validArrayWithEqualTo = ['adequate', 'array', 'length'];
    expect(parseOrFail(textSchema, validArrayWithEqualTo)).toEqual(validArrayWithEqualTo);
    expect(() => parseOrFail(textSchema, ['adequate', 'array', 'length', 'test'])).toThrow(
      'The received value length is greater than expected',
    );
  });
});
