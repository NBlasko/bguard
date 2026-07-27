/**
 * Validates the "exports" map in package.json against the actual build output.
 *
 * Catches two classes of mistake that npm and tsup are both happy to ignore:
 *   - a target path that points nowhere (wrong directory, or a directory that is really a file)
 *   - a wildcard subpath that matches no files at all, so consumers can never import it
 *
 * Run after `build:package`.
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const errors = [];

/** Collect every leaf string in a nested export condition object. */
function targets(value, path) {
  if (typeof value === 'string') return [[path, value]];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([condition, inner]) => targets(inner, `${path} → ${condition}`));
  }
  return [];
}

for (const [subpath, conditions] of Object.entries(pkg.exports ?? {})) {
  for (const [where, target] of targets(conditions, subpath)) {
    if (!target.startsWith('./')) {
      errors.push(`${where}: target "${target}" must be a relative path starting with "./"`);
      continue;
    }

    if (!target.includes('*')) {
      if (!existsSync(join(root, target))) errors.push(`${where}: "${target}" does not exist`);
      continue;
    }

    // Wildcard target: the directory must exist and hold at least one matching file.
    // The wildcard may sit mid-filename ("./lib/foo-*.js"), so split on the last slash
    // rather than using dirname, which would swallow a trailing directory segment.
    const [prefix, suffix] = target.split('*');
    const slash = prefix.lastIndexOf('/');
    const dirRelative = prefix.slice(0, slash);
    const filePrefix = prefix.slice(slash + 1);

    const dir = join(root, dirRelative);
    if (!existsSync(dir)) {
      errors.push(`${where}: "${target}" points into "${dirRelative}", which does not exist`);
      continue;
    }

    const matches = readdirSync(dir).filter((name) => name.startsWith(filePrefix) && name.endsWith(suffix));
    if (matches.length === 0) errors.push(`${where}: "${target}" matches no files in "${dirRelative}"`);
  }
}

// Legacy fields, used by bundlers and old resolvers that ignore "exports".
for (const field of ['main', 'module', 'types']) {
  const value = pkg[field];
  if (value && !existsSync(join(root, value))) errors.push(`"${field}": "${value}" does not exist`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} broken export target(s):\n`);
  for (const error of errors) console.error(`  ✗ ${error}`);
  console.error('');
  process.exit(1);
}

console.log('All export targets resolve to real files.');
