---
name: styling
description: Change how wadbrant.com looks. Use for any CSS or visual work: colours, spacing, type, hover and motion, dark mode, component styling, layout tweaks. Covers where each rule belongs, the cascade traps in this codebase, and how to prove the result in both colour modes.
---

# Styling this site

## Where a rule belongs

| Kind of change | File |
| --- | --- |
| a colour, radius or shadow used in more than one place | tokens in `src/styles/theme.css` |
| how an existing component looks | `src/styles/globals.css` |
| a new component's own styles | `src/styles/globals.css`, in its own commented block |
| grid, flex or spacing utilities | nothing; `layout.css` is settled infrastructure |

Never hard-code a colour in a component. Every colour resolves from a token
that has both a light and a dark value.

## The cascade, which is where the traps are

`layout.css` and `theme.css` load before `globals.css`, all unlayered, so a
rule in `globals.css` beats them at equal specificity. Tailwind utilities sit
in a layer and therefore lose to all of it, by design.

Two things to know before writing a selector:

- `.content` wraps article prose and also the categories page. A rule intended
  for prose must be written `.content :where(a:not(...))` so that component
  rules inside `.content` can still win. Writing it as a plain compound
  selector makes it too strong to override and category links turn into prose
  links.
- `.preview-img` must keep `position: relative`. The `.shimmer` class that used
  to supply it is removed once the image loads, and without it any
  `<Image fill>` escapes its column and gets upscaled, which reads as blur.

`!important` is not the fix. If a rule will not stick, the specificity or the
order is wrong. `:where()` is usually the answer for keeping a broad rule weak.

## The design the site is aiming at

Minimal first: fewer elements, fewer colours, more whitespace. One warm accent,
`--accent`, carries every interactive state; nothing is blue. Links are never
underlined. Motion is 150 to 250ms, ease-out, small distances, and always
wrapped by the existing `prefers-reduced-motion` block.

## Proving it

```bash
npm run verify
```

`tests/contrast.mjs` renders both colour modes and measures every text surface
against its real composited background: 4.5:1 for body text, 3:1 for large. If
you introduce a new surface or text colour, add a sample to its `SAMPLES` list
in the same commit, otherwise the change is unverified.

For a refactor that should change nothing visible, prove it:

```bash
node tests/snapshot.mjs baseline    # before
node tests/snapshot.mjs after       # after
node tests/snapshot.mjs --diff baseline after
```

Look at anything above 0.02% in `.snapshots/diff/` before assuming it is noise.
Disable smooth scrolling when capturing, or fixed elements land mid-scroll and
every page shows a false difference.

## Checking a change by eye

Screenshot both modes rather than guessing. Set the mode before navigating:

```js
await page.evaluateOnNewDocument((m) => localStorage.setItem('mode', m), 'dark');
```

Then read the pixels. A change is not done because the CSS looks right.
