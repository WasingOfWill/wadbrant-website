#!/usr/bin/env node
/**
 * Works out which rules of a stylesheet the site actually uses, and writes a
 * trimmed copy.
 *
 *   node scripts/audit-css.mjs src/styles/theme.css src/styles/theme.next.css
 *
 * Every page of the running local site is loaded and each selector is tested
 * against it. State that only exists at runtime (menu open, search active,
 * dark mode) is kept via the safelist below.
 */
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';
import puppeteer from 'puppeteer';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('usage: node scripts/audit-css.mjs <input.css> <output.css>');
  process.exit(1);
}

const BASE = process.env.LOCAL ?? 'http://localhost:4000';

const PAGES = [
  '/',
  '/posts/why-indie-games-fail/',
  '/posts/deep-into-mystery-games/',
  '/posts/2025-10-26-pleyconnect/',
  '/tags/',
  '/tags/product-management/',
  '/categories/',
  '/categories/indie/',
  '/archives/',
  '/about/',
  '/cv/',
  '/not-a-page/',
];

/** Selectors containing any of these are kept without testing. */
const SAFELIST = [
  'sidebar-display',
  'data-mode',
  'data-search',
  'data-theme',
  ':root',
  'html',
  'body',
  'unloaded',
  'shimmer',
  'is-active-link',
  'toc-link',
  'collapse',
  'show',
  'active',
  'disabled',
  'hide-border-bottom',
  'category-trigger',
  'mode-toggle',
  'popup',
  'img-link',
  'code-header',
  'copy-code',
  'highlight',
  'rouge',
  'language-',
  'prompt-',
  'table-wrapper',
  'footnote',
  'search',
  'back-to-top',
  'mask',
  'tooltip',
  'skip-link',
  'print',
];

/** Strips runtime-only bits so the selector can be tested statically. */
function testable(selector) {
  return selector
    .replace(/::?(hover|focus|focus-visible|focus-within|active|visited|target|before|after|placeholder|selection|marker|first-line|first-letter|-webkit-[a-z-]+|-moz-[a-z-]+)(\([^)]*\))?/g, '')
    .replace(/:is\(/g, ':is(')
    .trim();
}

const source = fs.readFileSync(inputPath, 'utf8');
const root = postcss.parse(source);

const selectors = new Set();
root.walkRules((rule) => {
  if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
  rule.selectors.forEach((selector) => selectors.add(selector));
});

const list = [...selectors];
console.log(`${list.length} selectors to test across ${PAGES.length} pages`);

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const used = new Set();

for (const route of PAGES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch {
    await page.close();
    continue;
  }
  // Open the menus and overlays so their markup exists in the DOM.
  await page.evaluate(() => {
    document.documentElement.setAttribute('sidebar-display', '');
    document.documentElement.setAttribute('data-mode', 'dark');
  });

  const found = await page.evaluate((candidates) => {
    const hits = [];
    for (const selector of candidates) {
      try {
        if (document.querySelector(selector)) hits.push(selector);
      } catch {
        hits.push(selector); // unparseable here - keep it rather than risk breakage
      }
    }
    return hits;
  }, list.map(testable).map((s, i) => s || list[i]));

  found.forEach((selector) => used.add(selector));
  await page.close();
}

await browser.close();

/** Maps a raw selector back to "is it used?". */
const isUsed = (selector) => {
  if (SAFELIST.some((token) => selector.includes(token))) return true;
  const probe = testable(selector);
  return used.has(probe) || used.has(selector) || probe === '';
};

let removed = 0;
root.walkRules((rule) => {
  if (rule.parent?.type === 'atrule' && /keyframes/.test(rule.parent.name)) return;
  const keep = rule.selectors.filter(isUsed);
  if (keep.length === 0) {
    removed += 1;
    rule.remove();
  } else if (keep.length !== rule.selectors.length) {
    rule.selectors = keep;
  }
});

// Drop at-rules that ended up empty.
root.walkAtRules((atRule) => {
  if (/keyframes|font-face|charset|import/.test(atRule.name)) return;
  if (atRule.nodes && atRule.nodes.length === 0) atRule.remove();
});

// Drop keyframes nobody animates any more.
const css = root.toString();
root.walkAtRules(/keyframes/, (atRule) => {
  const name = atRule.params.trim();
  const referenced = new RegExp(`animation(-name)?\\s*:[^;}]*\\b${name}\\b`).test(css);
  if (!referenced) atRule.remove();
});

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, root.toString(), 'utf8');

const before = Buffer.byteLength(source);
const after = Buffer.byteLength(root.toString());
console.log(`removed ${removed} unused rules`);
console.log(`${(before / 1024).toFixed(1)}KB -> ${(after / 1024).toFixed(1)}KB`);
