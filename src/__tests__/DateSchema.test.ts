import { expectEqualTypes } from '../../jest/setup';
import { parseOrFail } from '../parseOrFail';
import { BuildSchemaError, InferType, ValidationError } from '../';
import { date } from '../asserts/date';
import { dateMin } from '../asserts/date/dateMin';
import { dateMax } from '../asserts/date/dateMax';

describe('DateSchema', () => {
  const DATE_ERROR_MESSAGE = 'The received value is not a valid instance of Date';

  it('should be a valid Date', () => {
    const dateSchema = date();
    const actualDate = new Date();
    const parsedValue = parseOrFail(dateSchema, actualDate);

    expectEqualTypes<typeof actualDate, InferType<typeof dateSchema>>(true);
    expectEqualTypes<typeof actualDate, typeof parsedValue>(true);
    expect(parsedValue).toBe(actualDate);
  });

  it('should throw an error for an invalid Date object', () => {
    const dateSchema = date();
    const invalidDate = new Date('invalid date string');

    expect(() => parseOrFail(dateSchema, invalidDate)).toThrow(DATE_ERROR_MESSAGE);
  });

  it('should throw an error for a number representing a timestamp', () => {
    const dateSchema = date();
    const timestamp = 1662457600000;

    expect(() => parseOrFail(dateSchema, timestamp)).toThrow(DATE_ERROR_MESSAGE);
  });

  it('should throw an error for a null value', () => {
    const dateSchema = date();

    expect(() => parseOrFail(dateSchema, null)).toThrow('Value should not be null');
  });

  it('should throw an error for an undefined value', () => {
    const dateSchema = date();

    expect(() => parseOrFail(dateSchema, undefined)).toThrow('The required value is missing');
  });

  it('should be valid for a Date object with a timezone offset', () => {
    const dateSchema = date();
    const dateWithOffset = new Date('2024-08-25T00:00:00+02:00');

    const parsedValue = parseOrFail(dateSchema, dateWithOffset);
    expect(parsedValue).toBe(dateWithOffset);
  });

  it('should allow null when nullable() is used', () => {
    const dateSchema = date().nullable();
    const parsedValue = parseOrFail(dateSchema, null);
    expectEqualTypes<Date | null, InferType<typeof dateSchema>>(true);

    expect(parsedValue).toBeNull();
  });

  it('should allow undefined when optional() is used', () => {
    const dateSchema = date().optional();
    const parsedValue = parseOrFail(dateSchema, undefined);
    expectEqualTypes<Date | undefined, InferType<typeof dateSchema>>(true);

    expect(parsedValue).toBeUndefined();
  });

  it('should validate a date string with full date and time in UTC format', () => {
    const dateSchema = date();
    const dateWithFullDateAndTimeInUTC = new Date('2024-01-11T00:00:00.000Z');
    const parsedValue = parseOrFail(dateSchema, dateWithFullDateAndTimeInUTC);
    expect(parsedValue).toBe(dateWithFullDateAndTimeInUTC);
  });

  it('should validate a date string with only the date portion', () => {
    const dateSchema = date();
    const datePortion = new Date('2024-01-11');
    const parsedValue = parseOrFail(dateSchema, datePortion);
    expect(parsedValue).toBe(datePortion);
  });

  it('should validate a date string with a short date format', () => {
    const dateSchema = date();
    const shortDateFormat = new Date('1/11/24');
    const parsedValue = parseOrFail(dateSchema, shortDateFormat);
    expect(parsedValue).toBe(shortDateFormat);
  });

  it('should invalidate a date string with an invalid month', () => {
    const dateSchema = date();
    expect(() => parseOrFail(dateSchema, new Date('2024-41-11T00:00:00.000'))).toThrow(ValidationError);
    expect(() => parseOrFail(dateSchema, new Date('2024-41-11T00:00:00.000'))).toThrow(DATE_ERROR_MESSAGE);
  });

  it('should invalidate a date string with an invalid time', () => {
    const dateSchema = date();
    expect(() => parseOrFail(dateSchema, new Date('2024-01-11T00:60:00.000Z'))).toThrow(ValidationError);
    expect(() => parseOrFail(dateSchema, new Date('2024-41-11T00:00:00.000'))).toThrow(DATE_ERROR_MESSAGE);
  });

  it('should pass validation for a date later than the minimum date', () => {
    const dateSchema = date().custom(dateMin('2024-01-01'));
    const receivedDate = new Date('2024-01-02');
    expect(parseOrFail(dateSchema, receivedDate)).toBe(receivedDate);
  });

  it('should pass validation for a date equal to the minimum date', () => {
    const dateSchema = date().custom(dateMin('2024-01-01'));
    const receivedDate = new Date('2024-01-01');
    expect(parseOrFail(dateSchema, receivedDate)).toBe(receivedDate);
  });

  it('should fail validation for a date earlier than the minimum date', () => {
    const dateSchema = date().custom(dateMin('2024-01-01'));
    const receivedDate = new Date('2022-12-31');
    expect(() => parseOrFail(dateSchema, receivedDate)).toThrow(ValidationError);
    expect(() => parseOrFail(dateSchema, receivedDate)).toThrow('The received value is less than expected');
  });

  it('should handle string input for the expected date', () => {
    const schemaWithStringDate = date().custom(dateMin('2024-06-15'));
    const receivedDate = new Date('2024-06-16');
    expect(parseOrFail(schemaWithStringDate, receivedDate)).toBe(receivedDate);
  });

  it('should throw BuildSchemaError for an invalid date in the assertion', () => {
    expect(() => dateMin('invalid-date')).toThrow(BuildSchemaError);
    expect(() => dateMin('invalid-date')).toThrow('Invalid date in Date assertion');
  });

  it('should handle string input for the received date', () => {
    const schemaWithStringDate = date().custom(dateMin('2024-06-15'));
    const receivedDate = new Date('2024-06-14');
    expect(() => parseOrFail(schemaWithStringDate, receivedDate)).toThrow(ValidationError);
    expect(() => parseOrFail(schemaWithStringDate, receivedDate)).toThrow('The received value is less than expected');
  });

  it('should handle date input for the expected date', () => {
    const schemaWithDate = date().custom(dateMin(new Date('2024-06-15')));
    const receivedDate = new Date('2024-06-16');
    expect(parseOrFail(schemaWithDate, receivedDate)).toBe(receivedDate);
  });

  it('should correctly set and use the error key and message', () => {
    const dateSchema = date().custom(dateMin('2024-01-01'));
    const receivedDate = new Date('2023-12-31');
    expect(() => parseOrFail(dateSchema, receivedDate)).toThrow(ValidationError);
    expect(() => parseOrFail(dateSchema, receivedDate)).toThrow('The received value is less than expected');
  });

  it('should pass when the received date is equal to the minimum date', () => {
    const schema = date().custom(dateMin(new Date('2024-08-25T00:00:00+02:00')));
    expect(() => parseOrFail(schema, new Date('2024-08-25T00:00:00+02:00'))).not.toThrow();
  });

  it('should pass when the received date is after the minimum date', () => {
    const schema = date().custom(dateMin(new Date('2024-01-11T00:00:00.000Z')));
    expect(() => parseOrFail(schema, new Date('2024-01-12T00:00:00.000Z'))).not.toThrow();
  });

  it('should fail when the received date is before the minimum date', () => {
    const schema = date().custom(dateMin(new Date('2024-01-11T00:00:00.000Z')));
    expect(() => parseOrFail(schema, new Date('2024-01-10T00:00:00.000Z'))).toThrow(ValidationError);
  });

  it('should pass with different date formats', () => {
    const schema = date().custom(dateMin(new Date('1/11/24')));
    expect(() => parseOrFail(schema, new Date('1/11/24'))).not.toThrow();
    expect(() => parseOrFail(schema, new Date('1/12/24'))).not.toThrow();
  });

  it('should fail with different date formats when the received date is earlier', () => {
    const schema = date().custom(dateMin(new Date('1/11/24')));
    expect(() => parseOrFail(schema, new Date('1/10/24'))).toThrow(ValidationError);
  });

  it('should have a good dateMin translation key', () => {
    expect(dateMin.key).toBe('dt:min');
  });

  it('should pass validation for a date earlier than the maximum date', () => {
    const dateSchema = date().custom(dateMax('2024-12-31'));
    const receivedDate = new Date('2024-12-30');
    expect(parseOrFail(dateSchema, receivedDate)).toBe(receivedDate);
  });

  it('should pass validation for a date equal to the maximum date', () => {
    const dateSchema = date().custom(dateMax('2024-12-31'));
    const receivedDate = new Date('2024-12-31');
    expect(parseOrFail(dateSchema, receivedDate)).toBe(receivedDate);
  });

  it('should fail validation for a date later than the maximum date', () => {
    const dateSchema = date().custom(dateMax('2024-12-31'));
    const receivedDate = new Date('2025-01-01');
    expect(() => parseOrFail(dateSchema, receivedDate)).toThrow(ValidationError);
    expect(() => parseOrFail(dateSchema, receivedDate)).toThrow('The received value is greater than expected');
  });

  it('should handle string input for the expected date', () => {
    const dateSchema = date().custom(dateMax('2024-06-15'));
    const receivedDate = new Date('2024-06-14');
    expect(parseOrFail(dateSchema, receivedDate)).toBe(receivedDate);
  });

  it('should throw BuildSchemaError for an invalid date in the assertion', () => {
    expect(() => dateMax('invalid-date')).toThrow(BuildSchemaError);
    expect(() => dateMin('invalid-date')).toThrow('Invalid date in Date assertion');
  });

  it('should handle string input for the received date', () => {
    const dateSchema = date().custom(dateMax('2024-06-15'));
    const receivedDate = new Date('2024-06-16');
    expect(() => parseOrFail(dateSchema, receivedDate)).toThrow(ValidationError);
    expect(() => parseOrFail(dateSchema, receivedDate)).toThrow('The received value is greater than expected');
  });

  it('should handle date input for the expected date', () => {
    const dateSchema = date().custom(dateMax(new Date('2024-06-15')));
    const receivedDate = new Date('2024-06-14');
    expect(parseOrFail(dateSchema, receivedDate)).toBe(receivedDate);
    expect(() => parseOrFail(dateSchema, receivedDate)).not.toThrow();
  });

  it('should pass when the received date is equal to the maximum date', () => {
    const schema = date().custom(dateMax(new Date('2024-08-25T00:00:00+02:00')));
    expect(() => parseOrFail(schema, new Date('2024-08-25T00:00:00+02:00'))).not.toThrow();
  });

  it('should pass when the received date is before the maximum date', () => {
    const schema = date().custom(dateMax(new Date('2024-08-25T00:00:00+02:00')));
    expect(() => parseOrFail(schema, new Date('2024-08-24T23:00:00+02:00'))).not.toThrow();
  });

  it('should fail when the received date is after the maximum date', () => {
    const schema = date().custom(dateMax(new Date('2024-01-11T00:00:00.000Z')));
    expect(() => parseOrFail(schema, new Date('2024-01-12T00:00:00.000Z'))).toThrow(ValidationError);
  });

  it('should pass with different date formats', () => {
    const schema = date().custom(dateMax(new Date('1/11/24')));
    expect(() => parseOrFail(schema, new Date('1/10/24'))).not.toThrow();
    expect(() => parseOrFail(schema, new Date('1/11/24'))).not.toThrow();
  });

  it('should fail with different date formats when the received date is later', () => {
    const schema = date().custom(dateMax(new Date('1/11/24')));
    expect(() => parseOrFail(schema, new Date('1/12/24'))).toThrow(ValidationError);
  });

  it('should have a good dateMin translation key', () => {
    expect(dateMax.key).toBe('dt:max');
  });
});
