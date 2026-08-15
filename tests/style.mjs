/**
 * Enforces the house writing rules on everything the project authors:
 * interface copy, documentation, comments, commit-facing text.
 *
 *   node tests/style.mjs
 *
 * Two rules, both absolute:
 *   1. no bold
 *   2. no em dashes
 *
 * Articles under content/ and the notes under writing/ are the author's own
 * voice and are left alone.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const INCLUDE_DIRS = ['src', 'scripts', 'tests', '.claude'];
const INCLUDE_FILES = ['README.md', 'DEPLOY.md', 'reference.md', 'content/README.md'];
// Vendored or generated stylesheets, and the font faces, are not our prose.
const SKIP_FILES = new Set([
  'src/styles/layout.css',
  'src/styles/theme.css',
  'src/styles/fonts.css',
]);
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.css', '.md', '.json']);

const EM_DASH = /\u2014/;
const BOLD_MARKDOWN = /\*\*[^*\n]+\*\*/;
const BOLD_HTML = /<(b|strong)\b/i;
const BOLD_CLASS = /font-weight:\s*(bold|[7-9]00)|fw-bold|font-bold/i;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    /*
     * `.claude/worktrees` holds full checkouts of this repository, so walking
     * into one reports every problem in it a second time and fails the commit
     * hook for work that is not being committed.
     */
    if (entry.name === 'node_modules' || entry.name.startsWith('.next')) return [];
    if (entry.name === 'worktrees' && path.basename(dir) === '.claude') return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const targets = [
  ...INCLUDE_DIRS.flatMap((dir) => walk(path.join(ROOT, dir))),
  ...INCLUDE_FILES.map((file) => path.join(ROOT, file)),
].filter((file) => fs.existsSync(file) && EXTENSIONS.has(path.extname(file)));

const problems = [];

for (const file of targets) {
  const relative = path.relative(ROOT, file).replace(/\\/g, '/');
  if (SKIP_FILES.has(relative)) continue;

  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, index) => {
    const where = `${relative}:${index + 1}`;
    if (EM_DASH.test(line)) problems.push(`${where}  em dash`);
    if (BOLD_MARKDOWN.test(line) || BOLD_HTML.test(line)) problems.push(`${where}  bold text`);
    if (relative.endsWith('.css') && BOLD_CLASS.test(line)) problems.push(`${where}  bold weight`);
  });
}

if (problems.length) {
  console.error(`style checks failed (${problems.length}):`);
  for (const problem of problems.slice(0, 40)) console.error(`  - ${problem}`);
  if (problems.length > 40) console.error(`  ... and ${problems.length - 40} more`);
  process.exit(1);
}

console.log(`style ok - ${targets.length} files, no bold, no em dashes`);
