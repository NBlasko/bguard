import { expectEqualTypes } from '../../jest/setup';
import { BuildSchemaError } from '../exceptions';
import { parseSchema, InferType, array, number } from '../';

describe('ArraySchema', () => {
  it('should be an array', () => {
    const arrayOfNumbersSchema = array(number());
    expectEqualTypes<number[], InferType<typeof arrayOfNumbersSchema>>(true);
    const myArray = [1, 2, 3];
    expect(parseSchema(arrayOfNumbersSchema, myArray)).toBe(myArray);
    expect(() => parseSchema(arrayOfNumbersSchema, 1)).toThrow('Expected an array but received a different type');
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
});
