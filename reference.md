# reference.md

What this project is, for anyone about to change it. A map, not a manual.
Keep it short.

## The site

wadbrant.com, Will Wadbrant's personal site. Articles on product management,
the gaming industry and AI. Static, fast, no runtime services.

## Stack

Next.js 15 (App Router, React 19, TypeScript), Markdown content, plain CSS,
deployed on Vercel. Every page is prerendered at build time.

## Layout

```
content/            the only thing you edit to publish
  posts/            articles, one .md per post
  pages/            about, cv
  drafts/           not built
public/assets/      images, self-hosted fonts, favicons
src/
  app/              routes
  components/       UI
  lib/
    site.ts         title, nav, social links, analytics id
    posts.ts        reads content/, derives tags, categories, archives, related
    markdown.ts     Markdown to HTML pipeline
    headings.ts     table-of-contents extraction
  styles/
    globals.css     load order and site-specific rules
    theme.css       design tokens and component looks
    layout.css      grid, flex and spacing utilities
    fonts.css       self-hosted font faces
scripts/            post scaffolding, image tooling, CSS audit
tests/              automated checks, see tests/README.md
writing/            style guide and the AI editing workflow
```

## Routes

`/`, `/articles/`, `/posts/[slug]/`, `/categories/`, `/categories/[slug]/`,
`/tags/[slug]/`, `/archives/`, `/about/`, `/cv/`, `/feed.xml`, `/sitemap.xml`,
`/robots.txt`, `/search.json`.

All URLs end in a trailing slash.

`/` is the hex map, described below, and is the one page that does not use the
shared `Layout`. The article list lives at `/articles/`. Tags have no index of
their own: the tag cloud sits at the bottom of `/categories/`, and `/tags/`
redirects there. Individual tag pages still exist.

## The homepage map

`/` is a pointy-top hex grid, not a document: sidebar only, no top bar, no side
panel, no footer, and the page does not scroll. `lib/hexmap.ts` computes the
whole grid at build time, `components/HexMap.tsx` renders it as one SVG, and
`styles/hexmap.css` holds every rule, scoped to that page.

Six regions sit on ring 1, one per compass direction: AI, Gaming, Industry,
Product, Business, Misc. Each owns the 60 degree wedge pointing away from home
and claims as much of it as it has earned: three tiles at least, six at most,
one per post. A region with more posts than land spends one more tile on a gate
to `/categories/`. That is what makes the six territories different shapes, and
`tests/build-output.mjs` fails if they all come out the same size. Beyond them,
rings 4 to 6 are scenery, thinned by a deterministic noise function so the
frontier is ragged rather than three neat outlines.

Interaction lives in `components/HexMapView.tsx`, the only client component on
the page. Nothing about an article is visible until you enter its region: until
then its tile shows ground and a question mark, and cannot be picked. Choosing
a tile moves the pawn, pans the camera halfway towards it, and fills the
readout on the right, which is a bottom sheet on a phone. The map can also be
dragged a quarter of the window in any direction, with a throw that carries.

Two things in that file are easy to undo by accident. The tile under a press is
recorded on `pointerdown`, because pointer capture retargets every later event
to the capturing element. And `discovered` is read through a ref, because the
pointer handlers are memoised and would otherwise judge every tap against the
first render's empty set.

Regions are a homepage-only grouping. Nothing in `content/` knows about them:
`REGIONS[].matches` lists the front matter categories that feed each one, best
match first, and anything unmatched falls to Misc. Retagging the content to the
six names is a separate job; the map will follow it.

The drawn map under the grid is `public/assets/images/website/map.jpg`, faded
by `--map-wash` and masked to nothing well before any window edge.
`tests/functional.mjs` reads the border pixels at four window sizes to prove it,
because a mask radius that is safe at one size is not at another.

## Content model

Front matter drives everything; `content/README.md` has the full list. The
essentials: `title`, `date`, `categories` (first entry is the top-level group),
`tags`, optional `image`, `pin`, `description`.

Rules worth knowing:

- Future-dated posts are not published.
- The filename after the date prefix becomes the URL slug.
- Excerpts are the first block of the post, trimmed to 200 characters.
- Reading time on cards is `ceil(words / 200)`, on a post `floor(words / 180)`.
- Dates render in `America/New_York` on the server, so they never shift.

## Derived data

`lib/posts.ts` is the single source for anything computed: tag and category
groupings, the archives timeline, recently updated, trending tags, and related
posts (1 point per shared tag, 0.5 per shared category, top three).

## Styling

Three layers, loaded in this order by `globals.css`: `layout.css` utilities,
`theme.css` tokens and components, then site-specific rules in `globals.css`.
Colour tokens live on `:root`; dark mode swaps them via `html[data-mode="dark"]`,
set by the sidebar toggle and remembered in `localStorage`.

One warm accent carries every interactive state, defined in `globals.css` as
`--accent`. Links are never underlined: prose links are accent-coloured, links
inside lists and panels are body-coloured and turn accent on hover.
`tests/contrast.mjs` measures the result in both modes.

Tailwind is available but scanned only in `src/app` and `src/components`. It
must never scan the stylesheets, or it mints utilities whose names collide with
ours.

## Interactive pieces

Search (static `/search.json`, filtered client-side), table of contents,
light and dark toggle, mobile off-canvas sidebar, image lightbox, back to top.
All small client components in `src/components`.

## Traps

Six things that have already cost an afternoon each.

- `getComputedStyle` reports anything that came out of `color-mix()` as
  `color(srgb r g b)`, with channels from 0 to 1, not as `rgb()` with channels
  from 0 to 255. Reading those floats as bytes makes every mixed colour look
  like near-black, which shows up as an impossible 1.00:1 contrast failure.
- A hovered colour cross-fades, so reading it in the same tick measures a frame
  part-way through the transition. `tests/contrast.mjs` waits before sampling.

- `.content` wraps article prose and also the categories page. Rules meant for
  prose must be written as `.content :where(a...)` so component rules inside it
  can still win.
- `.preview-img` has to keep `position: relative`. The `.shimmer` class that
  used to supply it is stripped once the image loads, and without it any
  `<Image fill>` escapes its column and is upscaled.
- Image originals are not kept in this repository. Add artwork at no more than
  1600px wide and run `npm run optimize:images`, which edits in place.
- The browser suites install Puppeteer on demand and it is not a dependency, so
  any later `npm install` removes it again. That is expected; the next run
  reinstalls it.

## Automation

`npm install` points git at `.githooks`, so committing runs the style and
content checks first. The full suite runs in CI on every push and pull request.

Repeatable procedures live as skills in `.claude/skills/`, currently publishing
an article and changing the styling. Add one when a job is done more than once.

## Commands

```bash
npm run dev              # localhost:4000
npm run build            # production build
npm start                # serve the build
npm run new -- "Title"   # scaffold a post
npm run verify           # build, then every automated check
npm test                 # the checks against an existing build
```

## Deploying

Push to `main`. Vercel builds from the repository root and deploys. Pull
requests get their own preview URL. See `DEPLOY.md`.
