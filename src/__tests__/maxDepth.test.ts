import { parse, parseOrFail, parseAsync, parseOrFailAsync, ValidationError, BuildSchemaError, setLocale } from '../';
import { CommonSchema, ExceptionContext, defaultMaxDepth } from '../core';
import { getTranslationByLocale } from '../translationMap';

import { array } from '../asserts/array';
import { lazy } from '../asserts/lazy';
import { object } from '../asserts/object';
import { record } from '../asserts/record';
import { string } from '../asserts/string';

/**
 * Validation recurses, so the depth of the INPUT decides how much stack a parse uses. Left unbounded
 * the ceiling was the runtime's: past roughly 900 levels the stack gave out, the `RangeError` was
 * swallowed by the parse functions' catch-all, and the caller got 'Something unexpected happened' —
 * an error naming neither the cause nor where in the payload it happened.
 *
 * What these tests hold in place is that the limit is the library's and is reported like any other
 * finding: a `'c:maxDepth'` issue carrying the path it stopped at.
 */
describe('maxDepth', () => {
  interface Node {
    next?: Node;
  }

  /**
   * A schema that follows the input as deep as it goes. The explicit `CommonSchema` annotation is what
   * lets the binding refer to itself, the same way `LazySchema.test.ts` declares its recursive schema.
   */
  const node: CommonSchema = object({ next: lazy<Node>('Node', () => node).optional() });

  /** `{"next":{"next":…{}}}`, nested `depth` levels, built through JSON so no literal sets a prototype. */
  const nest = (depth: number) => JSON.parse('{"next":'.repeat(depth) + '{}' + '}'.repeat(depth)) as unknown;

  describe('the default limit', () => {
    it('parses input nested just inside it', () => {
      expect(() => parseOrFail(node, nest(defaultMaxDepth - 1))).not.toThrow();
    });

    // The regression this exists for. Before the limit, this depth reached the recursion ceiling and
    // came back as `Error: Something unexpected happened`.
    it('reports input nested past it, instead of exhausting the stack', () => {
      const tooDeep = nest(defaultMaxDepth + 50);

      expect(() => parseOrFail(node, tooDeep)).toThrow(ValidationError);
      expect(() => parseOrFail(node, tooDeep)).toThrow(`nested deeper than the ${defaultMaxDepth} levels allowed`);
    });

    // The measured stack ceiling was around 900 with this schema, so this depth used to be the generic
    // error rather than any kind of validation result.
    it('reports rather than dying on input far past the stack ceiling', () => {
      let thrown: unknown;
      try {
        parseOrFail(node, nest(5000));
      } catch (e) {
        thrown = e;
      }

      expect(thrown).toBeInstanceOf(ValidationError);
      expect((thrown as Error).message).not.toBe('Something unexpected happened');
    });
  });

  describe('the reported issue', () => {
    it('carries the path where the input got too deep', () => {
      const [errors] = parse(node, nest(12), { maxDepth: 10 });

      expect(errors).not.toBeNull();
      const issue = (errors as NonNullable<typeof errors>)[0]!;

      expect(issue.code).toBe('c:maxDepth');
      expect(issue.expected).toBe(10);
      // One past the limit is where the check fires, and the path says exactly which level that was.
      expect(issue.received).toBe(11);
      expect(issue.path).toHaveLength(11);
      expect(issue.pathToError).toBe('.next'.repeat(11));
    });

    it('is collected alongside other findings under getAllErrors', () => {
      const schema = object({ name: string(), tree: node });
      const [errors] = parse(schema, { name: 42, tree: nest(6) }, { maxDepth: 4, getAllErrors: true });

      const codes = (errors as NonNullable<typeof errors>).map((error) => error.code);
      expect(codes).toContain('c:invalidType');
      expect(codes).toContain('c:maxDepth');
    });

    it('is translatable like any other message', () => {
      setLocale('depthLng', { 'c:maxDepth': 'Preduboko: dozvoljeno je {{e}}, primljeno {{r}}' });

      expect(() => parseOrFail(node, nest(4), { lng: 'depthLng', maxDepth: 2 })).toThrow(
        'Preduboko: dozvoljeno je 2, primljeno 3',
      );
    });
  });

  describe('counting', () => {
    // Depth is `path.length`, so it has to mean the same thing for every way of descending, not just
    // for object properties.
    it('counts array elements and record keys, not only properties', () => {
      const nestedArrays = array(array(array(string())));
      expect(() => parseOrFail(nestedArrays, [[['deep']]], { maxDepth: 2 })).toThrow('nested deeper than the 2');
      expect(() => parseOrFail(nestedArrays, [[['deep']]], { maxDepth: 3 })).not.toThrow();

      const nestedRecords = record(string(), record(string(), string()));
      expect(() => parseOrFail(nestedRecords, { a: { b: 'c' } }, { maxDepth: 1 })).toThrow('nested deeper than the 1');
      expect(() => parseOrFail(nestedRecords, { a: { b: 'c' } }, { maxDepth: 2 })).not.toThrow();
    });

    // A lazy schema resolving and a union trying a member both recurse without consuming input, so
    // neither may spend depth — otherwise the limit would depend on how a schema is written rather
    // than on how deep the data is.
    it('does not charge depth for resolving a lazy schema', () => {
      // Three levels of data through three lazy resolutions: allowed at a limit of 3.
      expect(() => parseOrFail(node, nest(3), { maxDepth: 3 })).not.toThrow();
      expect(() => parseOrFail(node, nest(4), { maxDepth: 3 })).toThrow(/nested deeper/);
    });

    /**
     * The boundary, and it caught a real defect in the first version of this check.
     *
     * An object schema walks its DECLARED shape, so validating `{ next?: … }` calls innerCheck for
     * `next` whether or not the input has it. With the check at the top of innerCheck, data nested
     * exactly to the limit was reported as one level past it — blamed on a property the payload never
     * contained. Depth is now only charged to a value that is actually present.
     */
    it('does not count a declared property the input does not have', () => {
      for (const limit of [1, 2, 3, 8]) {
        expect(() => parseOrFail(node, nest(limit), { maxDepth: limit })).not.toThrow();
        expect(() => parseOrFail(node, nest(limit + 1), { maxDepth: limit })).toThrow(/nested deeper/);
      }
    });

    it('charges depth to a present null, which is data at that depth', () => {
      const nullable = object({ next: object({ next: string().nullable() }) });

      expect(() => parseOrFail(nullable, { next: { next: null } }, { maxDepth: 2 })).not.toThrow();
      expect(() => parseOrFail(nullable, { next: { next: null } }, { maxDepth: 1 })).toThrow(/nested deeper/);
    });
  });

  // `ExceptionContext` is exported, so it can be built without going through a parse function. The
  // limit has to default there too: left undefined, `path.length > undefined` is false for every depth
  // and such a context would walk unbounded.
  describe('a directly built context', () => {
    const bare = () => new ExceptionContext('received', getTranslationByLocale(), '');

    it('gets the default limit', () => {
      expect(bare().maxDepth).toBe(defaultMaxDepth);
    });

    it('carries the limit into children and into a re-pointed copy', () => {
      const ctx = new ExceptionContext(
        'received',
        getTranslationByLocale(),
        '',
        undefined,
        undefined,
        [],
        undefined,
        [],
        7,
      );

      expect(ctx.createChild('a').maxDepth).toBe(7);
      expect(ctx.createChild('a').createChild(0).maxDepth).toBe(7);
      expect(ctx.withErrors([]).maxDepth).toBe(7);
    });
  });

  describe('the option', () => {
    it.each([0, -1, 1.5, NaN, Infinity])('rejects %p as a limit', (maxDepth) => {
      expect(() => parseOrFail(node, nest(1), { maxDepth: maxDepth as number })).toThrow(BuildSchemaError);
      expect(() => parseOrFail(node, nest(1), { maxDepth: maxDepth as number })).toThrow(
        'maxDepth must be a positive integer',
      );
    });

    it('applies to the async parses too', async () => {
      await expect(parseOrFailAsync(node, nest(4), { maxDepth: 2 })).rejects.toThrow('nested deeper than the 2');

      const [errors] = await parseAsync(node, nest(4), { maxDepth: 2 });
      expect((errors as NonNullable<typeof errors>)[0]!.code).toBe('c:maxDepth');
    });

    it('lets a caller who needs it go deeper than the default', () => {
      const deeper = defaultMaxDepth + 20;

      expect(() => parseOrFail(node, nest(deeper))).toThrow(/nested deeper/);
      expect(() => parseOrFail(node, nest(deeper), { maxDepth: deeper + 1 })).not.toThrow();
    });
  });
});
