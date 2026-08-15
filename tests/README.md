# Tests

These are the scripts used to verify that this site matches the Jekyll site it
replaced, and that its interactive parts still work. They are deliberately kept
out of `package.json` dependencies — Puppeteer downloads a browser, which would
slow every deploy down for no benefit.

```bash
npm i --no-save puppeteer pixelmatch pngjs
npm run build && npm start          # in another terminal
node tests/functional.mjs           # 18 UX checks, desktop + mobile
node tests/visual-diff.mjs          # pixel diff against https://wadbrant.com
python tests/compare-html.py        # text-level diff of every page
```

## snapshot.mjs

Captures every page locally and diffs two captures, which is how a refactor is
proven to change nothing:

```bash
node tests/snapshot.mjs baseline    # before the change
node tests/snapshot.mjs after       # after it
node tests/snapshot.mjs --diff baseline after
```

Differences above 0.02% are written to `.snapshots/diff/`.

## functional.mjs

Drives a real browser: light/dark toggle, search overlay, table of contents,
related posts, image lightbox, back-to-top, and the mobile off-canvas sidebar
(open via hamburger, close via the mask). Exits non-zero on failure.

## visual-diff.mjs

Screenshots each page on the live site and locally at 1440px and 390px, then
reports the share of differing pixels. Writes `out/live-*.png`, `out/v2-*.png`
and `out/diff-*.png`.

Expect roughly 0.2–0.5% on every page. That residue is the intended
differences: the sidebar no longer has AI/Portfolio entries, and it now has a
light/dark toggle. `/cv/` sits near 2% because kramdown turned one line of the
CV into a one-row table and this site renders it as a paragraph.

## compare-html.py

Fetches the live page and the local page, strips tags, and diffs the visible
text of `<main>` line by line. Useful for catching content-level regressions
(excerpt truncation, dates, reading time, ordering) without any pixel noise.

Known, accepted differences it reports:

- Two posts show a reading time one minute apart — Jekyll counted words
  inconsistently (sometimes Markdown source, sometimes rendered HTML).
- Email addresses differ because Cloudflare rewrites them on the live site.
