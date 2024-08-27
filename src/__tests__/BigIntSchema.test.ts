import { expectEqualTypes } from '../../jest/setup';
import { parseOrFail } from '../parseOrFail';
import { BuildSchemaError, InferType } from '../';
import { bigint } from '../asserts/bigint';
import { bigintMin } from '../asserts/bigint/bigintMin';
import { bigintMax } from '../asserts/bigint/bigintMax';
import { bigintMinExcluded } from '../asserts/bigint/bigintMinExcluded';
import { bigintMaxExcluded } from '../asserts/bigint/bigintMaxExcluded';

describe('BigIntSchema', () => {
  it('should be a bigint', () => {
    const bigIntSchema = bigint();
    // eslint-disable-next-line @typescript-eslint/no-inferrable-types
    const actualBigInt: bigint = 8n;
    const parsedValue = parseOrFail(bigIntSchema, actualBigInt);

    expectEqualTypes<typeof actualBigInt, InferType<typeof bigIntSchema>>(true);
    expectEqualTypes<typeof actualBigInt, typeof parsedValue>(true);
    expect(parsedValue).toBe(actualBigInt);
  });

  it('should be a bigin equalTo', () => {
    const bigIntSchema = bigint().equalTo(5n);
    const actualBigInt = 5n;
    const parsedValue = parseOrFail(bigIntSchema, actualBigInt);

    expectEqualTypes<typeof actualBigInt, InferType<typeof bigIntSchema>>(true);
    expectEqualTypes<typeof actualBigInt, typeof parsedValue>(true);
    expect(parsedValue).toBe(actualBigInt);
    expect(() => parseOrFail(bigIntSchema, 8n)).toThrow('The received value is not equal to expected');
  });

  it('should be equal to one of provided values', () => {
    const bigIntSchema = bigint().oneOfValues([5n, 3n]);
    const actualBigInt = 5n;
    const parsedValue = parseOrFail(bigIntSchema, actualBigInt);

    expectEqualTypes<5n | 3n, InferType<typeof bigIntSchema>>(true);
    expectEqualTypes<5n | 3n, typeof parsedValue>(true);
    expect(parsedValue).toBe(actualBigInt);
    expect(() => parseOrFail(bigIntSchema, 8n)).toThrow('The received value is not equal to expected');
  });

  it('should fail to use equalTo or oneOfValues multiple times or in combination', () => {
    const defaultErrorMessage =
      "It is allowed to call either 'equalTo' or 'oneOfValues,' but only one of them, and only once.";
    expect(() => bigint().equalTo(5n).oneOfValues([1n, 5n])).toThrow(defaultErrorMessage);
    expect(() => bigint().equalTo(5n).oneOfValues([1n, 5n])).toThrow(BuildSchemaError);
    expect(() => bigint().equalTo(5n).equalTo(5n)).toThrow(defaultErrorMessage);
    expect(() => bigint().equalTo(5n).equalTo(5n)).toThrow(BuildSchemaError);
    expect(() => bigint().oneOfValues([1n, 5n]).oneOfValues([1n, 5n])).toThrow(defaultErrorMessage);
    expect(() => bigint().oneOfValues([1n, 5n]).oneOfValues([1n, 5n])).toThrow(BuildSchemaError);
    expect(() => bigint().oneOfValues([1n, 5n]).equalTo(5n)).toThrow(defaultErrorMessage);
    expect(() => bigint().oneOfValues([1n, 5n]).equalTo(5n)).toThrow(BuildSchemaError);
  });

  it('should be greater than or equal to 5n', () => {
    const bigintSchema = bigint().custom(bigintMin(5n));
    expectEqualTypes<bigint, InferType<typeof bigintSchema>>(true);

    expect(parseOrFail(bigintSchema, 8n)).toBe(8n);
    expect(parseOrFail(bigintSchema, 5n)).toBe(5n);
    expect(() => parseOrFail(bigintSchema, 4n)).toThrow('The received value is less than expected');
  });

  it('should be less than or equal to 5n', () => {
    const bigintSchema = bigint().custom(bigintMax(5n));
    expectEqualTypes<bigint, InferType<typeof bigintSchema>>(true);

    expect(parseOrFail(bigintSchema, 2n)).toBe(2n);
    expect(parseOrFail(bigintSchema, 5n)).toBe(5n);
    expect(() => parseOrFail(bigintSchema, 9n)).toThrow('The received value is greater than expected');
  });

  it('should be greater than 5n', () => {
    const numberSchema = bigint().custom(bigintMinExcluded(5n));
    expectEqualTypes<bigint, InferType<typeof numberSchema>>(true);

    expect(parseOrFail(numberSchema, 8n)).toBe(8n);
    expect(() => parseOrFail(numberSchema, 5n)).toThrow('The received value is less than or equal to expected');
    expect(() => parseOrFail(numberSchema, 4n)).toThrow('The received value is less than or equal to expected');
  });

  it('should be less than 5n', () => {
    const numberSchema = bigint().custom(bigintMaxExcluded(5n));
    expectEqualTypes<bigint, InferType<typeof numberSchema>>(true);

    expect(parseOrFail(numberSchema, 2n)).toBe(2n);
    expect(() => parseOrFail(numberSchema, 5n)).toThrow('The received value is greater than or equal to expected');
    expect(() => parseOrFail(numberSchema, 9n)).toThrow('The received value is greater than or equal to expected');
  });
});
