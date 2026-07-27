/**
 * Typechecks the self-contained code examples in the README source.
 *
 * An example a reader can copy has to compile. Three of them did not, at three different times: one
 * called `number()` without importing it, one read `error.message` from an `unknown` catch binding,
 * and a batch of new sections referenced `object` and `string` that were never imported. None of that
 * is visible by reading the Markdown.
 *
 * Only blocks that import from bguard are checked. A block written as a continuation of the prose —
 * marked by an `// import other dependencies` comment — is skipped, since it deliberately refers to
 * bindings introduced earlier in the text.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'scripts', 'readmeStart.md'), 'utf8');

const blocks = [...source.matchAll(/```typeScript\n([\s\S]*?)```/g)].map((match) => match[1]);

const checkable = blocks
  .map((code, index) => ({ code, index }))
  .filter(({ code }) => code.includes("from 'bguard") && !code.includes('// import other dependencies'));

// Resolve bguard specifiers against the sources, so this needs no build and no packing.
const rewrite = (code) =>
  code
    .replace(/from 'bguard\/object\/(\w+)'/g, (_, name) => `from '${join(root, 'src/asserts/object', name)}'`)
    .replace(/from 'bguard\/(\w+)\/(\w+)'/g, (_, dir, name) => `from '${join(root, 'src/asserts', dir, name)}'`)
    .replace(
      /from 'bguard\/(InferType|core|codeGen|translationMap|exceptions|commonTypes)'/g,
      (_, name) => `from '${join(root, 'src', name)}'`,
    )
    .replace(/from 'bguard\/(\w+)'/g, (_, dir) => `from '${join(root, 'src/asserts', dir, 'index')}'`)
    .replace(/from 'bguard'/g, `from '${join(root, 'src/index')}'`);

const dir = mkdtempSync(join(tmpdir(), 'bguard-docs-'));

try {
  const files = checkable.map(({ code, index }) => {
    const file = `example${index}.ts`;
    writeFileSync(join(dir, file), rewrite(code));
    return file;
  });

  writeFileSync(
    join(dir, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        target: 'es2022',
        module: 'node16',
        moduleResolution: 'node16',
        skipLibCheck: true,
        // The examples declare bindings they then only read as types, which is the point of them.
        noUnusedLocals: false,
      },
      include: files,
    }),
  );

  execFileSync(join(root, 'node_modules/.bin/tsc'), ['-p', dir], { stdio: 'inherit' });
  console.log(`All ${files.length} README examples compile.`);
} catch {
  console.error(`\nA README example above does not compile. It lives in scripts/readmeStart.md.`);
  process.exit(1);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
