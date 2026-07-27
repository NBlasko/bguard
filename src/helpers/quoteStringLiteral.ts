/**
 * Renders a value as a single-quoted TypeScript string literal.
 *
 * codeGen writes its output to a source file, so a literal containing a quote, a backslash or a
 * line break has to be escaped. Interpolating the raw value produced source that does not parse,
 * for example `'it's'` from `string().equalTo("it's")`.
 */
const escapes: Record<string, string> = {
  '\\': '\\\\',
  "'": "\\'",
  '\n': '\\n',
  '\r': '\\r',
  '\t': '\\t',
  // A JavaScript parser treats these two as line breaks inside a string literal.
  '\u2028': '\\u2028',
  '\u2029': '\\u2029',
};

export function _quoteStringLiteral(value: string): string {
  return `'${value.replace(/[\\'\n\r\t\u2028\u2029]/g, (char) => escapes[char] ?? char)}'`;
}
