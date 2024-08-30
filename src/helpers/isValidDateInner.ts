export function isValidDateInner(d: unknown) {
  return (
    // @ts-expect-error we expect d to have getTime method
    Object.prototype.toString.call(d) === '[object Date]' && !isNaN(typeof d?.getTime === 'function' && d.getTime())
  );
}
