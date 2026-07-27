import { parse, parseOrFail, ValidationError } from '../';
import { array } from '../asserts/array';
import { object } from '../asserts/object';
import { string } from '../asserts/string';
import { minLength } from '../asserts/string/minLength';

/**
 * `id()` and `description()` exist so a validation error can be mapped back to the field that
 * produced it. That requires the error to carry the metadata of the schema that actually failed,
 * in both reporting modes.
 *
 * Two things used to prevent it: the object and array branches passed the *container's* metadata to
 * every child, so a property's own `id()` was never reported; and `addIssue` attached metadata only
 * when throwing, dropping it on the path that collects errors — which is the path `getAllErrors`
 * uses, and therefore the one forms actually run.
 */
describe('error metadata', () => {
  it('reports the failing property own metadata', () => {
    const schema = object({ foo: string().id('fooId').description('Foo field') });

    const [errors] = parse(schema, { foo: 5 });

    expect(errors![0]!.pathToError).toBe('.foo');
    expect(errors![0]!.meta).toEqual({ id: 'fooId', description: 'Foo field' });
  });

  it('prefers the child metadata over the container one', () => {
    const schema = object({ foo: string().id('childId') }).id('rootId');

    expect(parse(schema, { foo: 5 })[0]![0]!.meta).toEqual({ id: 'childId' });
  });

  it('inherits the container metadata when the child has none', () => {
    const schema = object({ foo: string() }).id('rootId');

    expect(parse(schema, { foo: 5 })[0]![0]!.meta).toEqual({ id: 'rootId' });
  });

  it('reports metadata in getAllErrors mode as well as single-error mode', () => {
    const schema = object({
      a: array(string().custom(minLength(3)))
        .id('addr')
        .description('Users address'),
    });
    const received = { a: ['xy'] };
    const expected = { id: 'addr', description: 'Users address' };

    expect(parse(schema, received)[0]![0]!.meta).toEqual(expected);
    expect(parse(schema, received, { getAllErrors: true })[0]![0]!.meta).toEqual(expected);
  });

  it('reports metadata on the thrown error', () => {
    const schema = object({ foo: string().id('fooId') });

    expect.assertions(2);
    try {
      parseOrFail(schema, { foo: 5 });
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
      expect((e as ValidationError).meta).toEqual({ id: 'fooId' });
    }
  });

  it('lets an array element carry its own metadata', () => {
    const schema = object({
      list: array(string().custom(minLength(3)).id('itemId')).id('listId'),
    });

    expect(parse(schema, { list: ['xy'] })[0]![0]!.meta).toEqual({ id: 'itemId' });
  });

  it('keeps inheriting the array metadata for elements that have none', () => {
    const schema = object({
      address: array(string().custom(minLength(3)))
        .id('address')
        .description('Users address'),
    });

    const [errors] = parse(schema, { address: ['my'] });

    expect(errors![0]!.pathToError).toBe('.address[0]');
    expect(errors![0]!.meta).toEqual({ id: 'address', description: 'Users address' });
  });

  it('leaves metadata undefined when no schema on the path declares any', () => {
    expect(parse(object({ foo: string() }), { foo: 5 })[0]![0]!.meta).toBeUndefined();
  });
});
