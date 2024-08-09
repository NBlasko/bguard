export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false;

export function expectEqualTypes<X, Y>(areEqual: Equal<X, Y>): void {
  expect(typeof areEqual).toBe('boolean');
}
