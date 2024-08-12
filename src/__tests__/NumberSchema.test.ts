import { expectEqualTypes } from '../../jest/setup';
import { parseSchema } from '../parseSchema';
import { max } from '../asserts/number/max';
import { maxExcluded } from '../asserts/number/maxExcluded';
import { min } from '../asserts/number/min';
import { minExcluded } from '../asserts/number/minExcluded';
import { positive } from '../asserts/number/positive';
import { InferType } from '../';
import { number } from '../asserts/number';
import { negative } from '../asserts/number/negative';

describe('NumberSchema', () => {
  it('should be a number', () => {
    const numberSchema = number();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualNumber: number = 8;
    const parsedValue = parseSchema(numberSchema, actualNumber);

    expectEqualTypes<typeof actualNumber, InferType<typeof numberSchema>>(true);
    expectEqualTypes<typeof actualNumber, typeof parsedValue>(true);
    expect(parsedValue).toBe(actualNumber);
  });

  it('should not be a number', () => {
    const numberSchema = number();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualNotNumber: string = '9';
    expectEqualTypes<typeof actualNotNumber, InferType<typeof numberSchema>>(false);
    expect(() => parseSchema(numberSchema, actualNotNumber)).toThrow('Invalid type of data');
  });

  it('should be greater than or equal to 5', () => {
    const numberSchema = number().custom(min(5));
    expectEqualTypes<number, InferType<typeof numberSchema>>(true);

    expect(parseSchema(numberSchema, 8)).toBe(8);
    expect(parseSchema(numberSchema, 5)).toBe(5);
    expect(() => parseSchema(numberSchema, 4)).toThrow('The received value is less than expected');
  });

  it('should be less than or equal to 5', () => {
    const numberSchema = number().custom(max(5));
    expectEqualTypes<number, InferType<typeof numberSchema>>(true);

    expect(parseSchema(numberSchema, 2)).toBe(2);
    expect(parseSchema(numberSchema, 5)).toBe(5);
    expect(() => parseSchema(numberSchema, 9)).toThrow('The received value is greater than expected');
  });

  it('should be greater than 5', () => {
    const numberSchema = number().custom(minExcluded(5));
    expectEqualTypes<number, InferType<typeof numberSchema>>(true);

    expect(parseSchema(numberSchema, 8)).toBe(8);
    expect(() => parseSchema(numberSchema, 5)).toThrow('The received value is less than or equal to expected');
    expect(() => parseSchema(numberSchema, 4)).toThrow('The received value is less than or equal to expected');
  });

  it('should be less than 5', () => {
    const numberSchema = number().custom(maxExcluded(5));
    expectEqualTypes<number, InferType<typeof numberSchema>>(true);

    expect(parseSchema(numberSchema, 2)).toBe(2);
    expect(() => parseSchema(numberSchema, 5)).toThrow('The received value is greater than or equal to expected');
    expect(() => parseSchema(numberSchema, 9)).toThrow('The received value is greater than or equal to expected');
  });

  it('should be equal to be positive and equal to 5', () => {
    const numberSchema = number().custom(positive()).equalTo(5);
    expectEqualTypes<5, InferType<typeof numberSchema>>(true);

    expect(parseSchema(numberSchema, 5)).toBe(5);
    expect(() => parseSchema(numberSchema, 4)).toThrow('The received value is not equal to expected');
    expect(() => parseSchema(numberSchema, 0)).toThrow('The received value is not a positive number');
    expect(() => parseSchema(numberSchema, -1)).toThrow('The received value is not a positive number');
  });

  it('should be equal to be positive and equal to 5', () => {
    const numberSchema = number().custom(negative()).equalTo(-2);
    expectEqualTypes<-2, InferType<typeof numberSchema>>(true);

    expect(parseSchema(numberSchema, -2)).toBe(-2);
    expect(() => parseSchema(numberSchema, -1)).toThrow('The received value is not equal to expected');
    expect(() => parseSchema(numberSchema, 0)).toThrow('The received value is not a negative number');
    expect(() => parseSchema(numberSchema, 4)).toThrow('The received value is not a negative number');
  });
});
