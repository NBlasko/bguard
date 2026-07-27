import { expectEqualTypes, hasErrors } from '../../jest/setup';
import { parse, parseOrFail, flattenErrors, treeifyErrors, codeGen } from '../';
import { InferType } from '../InferType';
import { array } from '../asserts/array';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { required } from '../asserts/object/required';
import { partial } from '../asserts/object/partial';
import { email } from '../asserts/string/email';
import { minLength } from '../asserts/string/minLength';

const errorsOf = (result: ReturnType<typeof parse>) => result[0]!;

describe('required', () => {
  const patchSchema = partial(object({ id: string(), name: string().custom(minLength(2)) }));

  it('makes every property required again', () => {
    const schema = required(patchSchema);

    expectEqualTypes<{ id: string; name: string }, InferType<typeof schema>>(true);
    expect(parseOrFail(schema, { id: '1', name: 'ab' })).toEqual({ id: '1', name: 'ab' });
    expect(hasErrors(parse(schema, {}))).toBe(true);
  });

  it('keeps the assertions of the properties', () => {
    expect(parse(required(patchSchema), { id: '1', name: 'a' })[0]![0]!.code).toBe('s:minLength');
  });

  it('leaves the source and its property schemas untouched', () => {
    required(patchSchema);

    // The source stays partial, so an empty object still validates against it.
    expect(parseOrFail(patchSchema, {})).toEqual({});
  });

  it('rejects a schema that is not an object schema', () => {
    expect(() => required(string() as unknown as typeof patchSchema)).toThrow(
      'Schema in required method is not an object schema',
    );
  });

  it('generates required properties', () => {
    expect(codeGen(required(partial(object({ a: string() }))))).toBe('{\n  a: string;\n};');
  });
});

/**
 * Both helpers work off `path`, the array form, which is why they could not exist before it did. They
 * are pure functions over the errors array, so they compose with either `parse` mode.
 */
describe('flattenErrors', () => {
  const userSchema = object({
    email: string().custom(email()),
    password: string().custom(minLength(8)),
    address: object({ street: string(), city: string() }),
  });

  it('groups messages under their top-level field', () => {
    const result = parse(
      userSchema,
      { email: 'nope', password: 'short', address: { street: 'a', city: 'b' } },
      {
        getAllErrors: true,
      },
    );

    expect(flattenErrors(errorsOf(result))).toEqual({
      formErrors: [],
      fieldErrors: {
        email: ['The received value does not match the required email pattern'],
        password: ['The received value length is less than expected'],
      },
    });
  });

  it('attributes a nested failure to the field it sits under', () => {
    // A form bound to `address` still needs to hear about address.street.
    const result = parse(userSchema, { email: 'a@b.com', password: 'longenough', address: { street: 1, city: 'b' } });

    expect(flattenErrors(errorsOf(result)).fieldErrors).toEqual({ address: ['Invalid type of data'] });
  });

  it('collects several messages for the same field', () => {
    const schema = object({ name: string().custom(minLength(5), email()) });

    const flat = flattenErrors(errorsOf(parse(schema, { name: 'ab' }, { getAllErrors: true })));

    expect(flat.fieldErrors.name).toHaveLength(2);
  });

  it('puts a root failure in formErrors', () => {
    // A wrong type for the whole value belongs to no single field.
    const flat = flattenErrors(errorsOf(parse(userSchema, 'nope')));

    expect(flat.formErrors).toEqual(['Expected an object but received a different type']);
    expect(flat.fieldErrors).toEqual({});
  });

  it('names the field of a missing property', () => {
    const flat = flattenErrors(errorsOf(parse(object({ a: string(), b: string() }), {}, { getAllErrors: true })));

    expect(Object.keys(flat.fieldErrors)).toEqual(['a', 'b']);
  });

  it('uses the index for a failure in an array at the root', () => {
    const flat = flattenErrors(errorsOf(parse(array(string()), ['a', 1])));

    expect(flat.fieldErrors).toEqual({ '1': ['Invalid type of data'] });
  });

  it('returns empty groups for an empty error list', () => {
    expect(flattenErrors([])).toEqual({ formErrors: [], fieldErrors: {} });
  });
});

describe('treeifyErrors', () => {
  it('mirrors the shape of the received value', () => {
    const schema = object({ address: object({ street: string(), city: string() }) });

    const tree = treeifyErrors(errorsOf(parse(schema, { address: { street: 1, city: 2 } }, { getAllErrors: true })));

    expect(tree).toEqual({
      errors: [],
      properties: {
        address: {
          errors: [],
          properties: {
            street: { errors: ['Invalid type of data'] },
            city: { errors: ['Invalid type of data'] },
          },
        },
      },
    });
  });

  it('keys array positions by their index', () => {
    const schema = object({ tags: array(string()) });

    const tree = treeifyErrors(errorsOf(parse(schema, { tags: ['a', 1] })));

    expect(tree.properties?.tags?.properties?.['1']?.errors).toEqual(['Invalid type of data']);
  });

  it('puts a root failure on the root node', () => {
    const tree = treeifyErrors(errorsOf(parse(string(), 1)));

    expect(tree).toEqual({ errors: ['Invalid type of data'] });
  });

  it('collects several messages on the same node', () => {
    const schema = object({ name: string().custom(minLength(5), email()) });

    const tree = treeifyErrors(errorsOf(parse(schema, { name: 'ab' }, { getAllErrors: true })));

    expect(tree.properties?.name?.errors).toHaveLength(2);
  });

  it('carries a message on a node that also has children', () => {
    // maxKeys fails on the object itself while a property fails underneath it.
    const schema = object({ inner: object({ a: string() }) });

    const tree = treeifyErrors(errorsOf(parse(schema, { inner: { a: 1, b: 2 } }, { getAllErrors: true })));

    expect(tree.properties?.inner?.errors).toEqual(['This property is not allowed in the object']);
    expect(tree.properties?.inner?.properties?.a?.errors).toEqual(['Invalid type of data']);
  });

  it('returns a bare root for an empty error list', () => {
    expect(treeifyErrors([])).toEqual({ errors: [] });
  });

  it('reuses a node reached twice through different errors', () => {
    const schema = object({ a: object({ x: string(), y: string() }) });

    const tree = treeifyErrors(errorsOf(parse(schema, { a: { x: 1, y: 2 } }, { getAllErrors: true })));

    expect(Object.keys(tree.properties!.a!.properties!)).toEqual(['x', 'y']);
  });
});
