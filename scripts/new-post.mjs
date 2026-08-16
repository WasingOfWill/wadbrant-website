#!/usr/bin/env node
/**
 * Creates a new post file with valid front matter.
 *
 *   npm run new -- "My Great Title" --categories "AI,Product Management" \
 *                                   --tags "AI,Doing Things" \
 *                                   --image assets/posts/<slug>/cover.png
 *
 * Everything except the title is optional.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const title = args.find((arg) => !arg.startsWith('--') && args[args.indexOf(arg) - 1]?.startsWith('--') !== true);

if (!title) {
  console.error('Usage: npm run new -- "Post title" [--categories "A,B"] [--tags "A,B"] [--image path]');
  process.exit(1);
}

function flag(name) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : undefined;
}

function list(value) {
  return value
    ? value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

const now = new Date();
const pad = (value) => String(value).padStart(2, '0');
const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;

const slug = title
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, '-')
  .replace(/^-+|-+$/g, '');

const categories = list(flag('categories'));
const tags = list(flag('tags'));
const image = flag('image');

const frontMatter = [
  '---',
  `title: "${title.replace(/"/g, '\\"')}"`,
  `date: ${date} ${time}`,
  `categories: [${categories.join(', ')}]`,
  `tags: [${tags.join(', ')}]`,
  ...(image ? ['image:', `  path: ${image}`, `  alt: "${title.replace(/"/g, '\\"')}"`] : []),
  '---',
  '',
  'Write the article here.',
  '',
].join('\n');

const file = path.join(process.cwd(), 'content', 'posts', `${date}-${slug}.md`);
if (fs.existsSync(file)) {
  console.error(`Refusing to overwrite ${file}`);
  process.exit(1);
}

fs.writeFileSync(file, frontMatter, 'utf8');
console.log(`Created ${path.relative(process.cwd(), file)}`);
console.log(`It will be published at /posts/${slug}/`);
