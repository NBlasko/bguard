import { _cloneValue } from '../helpers/cloneValue';

describe('_cloneValue', () => {
  it('copies plain objects, arrays and Dates at every depth', () => {
    const original = { list: [{ when: new Date(0) }], nested: { n: 1 } };
    const copy = _cloneValue(original);

    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    expect(copy.list).not.toBe(original.list);
    expect(copy.list[0]).not.toBe(original.list[0]);
    expect(copy.list[0]!.when).not.toBe(original.list[0]!.when);
    expect(copy.nested).not.toBe(original.nested);
  });

  it('returns primitives as they are', () => {
    expect(_cloneValue(5)).toBe(5);
    expect(_cloneValue('x')).toBe('x');
    expect(_cloneValue(null)).toBeNull();
    expect(_cloneValue(undefined)).toBeUndefined();
  });

  it('keeps class instances, Maps and functions by reference', () => {
    class Point {
      constructor(public x: number) {}
    }
    const point = new Point(1);
    const map = new Map([[1, 2]]);
    const fn = () => 1;
    const copy = _cloneValue({ point, map, fn });

    expect(copy.point).toBe(point);
    expect(copy.map).toBe(map);
    expect(copy.fn).toBe(fn);
  });

  it('copies an object with no prototype, keeping it prototype-free', () => {
    const original = Object.assign(Object.create(null) as Record<string, number>, { a: 1 });
    const copy = _cloneValue(original);

    expect(Object.getPrototypeOf(copy)).toBeNull();
    expect(copy).not.toBe(original);
    expect(copy['a']).toBe(1);
  });

  it('stores a __proto__ key as data rather than setting the prototype', () => {
    const original = JSON.parse('{"__proto__": {"isAdmin": true}}') as Record<string, unknown>;
    const copy = _cloneValue(original);

    expect(Object.keys(copy)).toEqual(['__proto__']);
    expect((copy as { isAdmin?: unknown }).isAdmin).toBeUndefined();
  });

  it('copies a cycle without recursing for ever', () => {
    const original: { self?: unknown } = {};
    original.self = original;
    const copy = _cloneValue(original);

    expect(copy).not.toBe(original);
    expect(copy.self).toBe(copy);
  });

  it('copies an array that contains itself', () => {
    const original: unknown[] = [];
    original.push(original);
    const copy = _cloneValue(original);

    expect(copy[0]).toBe(copy);
  });
});
