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
  posts/            articles, one .md per post, drafts included
  pages/            about, cv
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
writing/            style guide, tag list and the post template
```

## Routes

`/`, `/articles/`, `/posts/[slug]/`, `/categories/`, `/categories/[slug]/`,
`/tags/[slug]/`, `/archives/`, `/about/`, `/cv/`, `/drafts/`, `/feed.xml`,
`/sitemap.xml`, `/robots.txt`, `/search.json`.

All URLs end in a trailing slash.

`/` is the hex map, described below, and is the one page that does not use the
shared `Layout`. The article list lives at `/articles/`. Tags have no index of
their own: the tag cloud sits at the bottom of `/categories/`, and `/tags/`
redirects there. Individual tag pages still exist.

`/articles/` carries six category tabs, the same six as the map. Filtering is
an attribute on the list and a `?c=` in the URL, not a re-render, so a link can
arrive already filtered; the category crumb on a post is one of those links.

## The homepage map

`/` is a pointy-top hex grid, not a document: sidebar only, no top bar, no side
panel, no footer, and the page does not scroll. `lib/hexmap.ts` computes the
whole grid at build time, `components/HexMap.tsx` renders it as one SVG, and
`styles/hexmap.css` holds every rule, scoped to that page.

The world is a set of settlements, not one blob. Home sits at the origin with
six gateway tiles around it, one per region, and clusters of recent work in the
gaps between the roads: two of two tiles marked New, one of three marked
Recommended, one of five marked Featured, filled newest first. Each gateway has
a city seven to nine tiles out in the same direction, reached by a road, and
that city is where the region's entries live. A city holds up to seventeen.

Around a city: the road tile facing home is the way back, ring 1 and ring 2
carry entries newest first, then a signpost for each subcategory, then a gate
to the category page if there is still more. A signpost is a place of its own,
four tiles further out, with its own entries and its own road back. Only as
many tiles are laid as there is something to put on them, so no two settlements
are the same shape, and distances and skews differ too.
`tests/build-output.mjs` fails if the cities all come out the same size, if a
city without a gate is not showing everything its region holds, if a settlement
has no way back, or if a signpost leads somewhere that was never laid.

Everything else is empty ground: clumps of unclaimed terrain placed by a coarse
noise function, faint, never interactive, and never dimmed by distance either.

Interaction lives in `components/HexMapView.tsx`, the only client component on
the page. Only the settlement you are standing in is legible; everything else
is drawn far off and cannot be picked. Taking a road draws the line out to the
city and moves the camera with it. The map can also be dragged a quarter of the
window in any direction, with a throw that carries.

Three things in that file are easy to undo by accident. The tile under a press
is recorded on `pointerdown`, because pointer capture retargets every later
event to the capturing element. `place` is read through a ref, because the
pointer handlers are memoised and would otherwise judge every tap against the
first render. And the readout stops pointer events reaching the map, or a touch
that means to scroll the sheet drags the world instead.

Article marks come from `ICON_RULES` in `lib/hexmap.ts`, matched against the
title, tags and categories, first hit wins. Nothing new goes in the front
matter to give a post a sensible icon.

The six regions are the site's real taxonomy, not a homepage-only grouping.
Every post's first category is one of them:

| Region | What goes in it |
| --- | --- |
| AI | Using it and building with it: ways of working, what is changing |
| Gaming | Game design, monetisation, and why players do what they do |
| News | What is happening out there, and what to make of it |
| Product | The craft of product management |
| Projects | Things built, how they were run, how they went |
| Misc | Opinions and odds and ends |

A post may carry one second category. There are three: Practice under AI,
Design under Gaming, Monetisation under Gaming. Keep it that way; each one
becomes an outpost on the map and a page under `/categories/`, and a long tail
of them makes both worse. `REGIONS[].matches` in `lib/hexmap.ts` maps a name to
a region, and anything unmatched falls to Misc. Renaming a category means
adding a redirect in `next.config.mjs`, which is where every retired name
already points.

The drawn map under the grid is `public/assets/images/website/map.jpg`, faded
by `--map-wash` and masked to nothing well before any window edge.
`tests/functional.mjs` reads the border pixels at four window sizes to prove it,
because a mask radius that is safe at one size is not at another.

## Drafts and scheduling

One folder, two flags. Everything lives in `content/posts/`.

- `draft: true` means still being written. Out of the article list, the feed,
  the sitemap, the search index and the map.
- A date in the future means written and waiting. Same exclusions, and it
  publishes itself when the day comes.
- Everything else is live.

Both still render at their real URL, marked and `noindex`, so a piece can be
read on the site before it goes out. `/drafts/` lists them, in progress and
scheduled, and is itself unlisted: nothing links to it, robots are told to stay
away, and it is not in the sitemap. Unlisted, not private. Anyone with the URL
can read it.

`npm run slot` decides the date: today if today is free, otherwise two days
past the last one booked. `tests/build-output.mjs` checks that no draft leaks
into anything indexable.

## Content model

Front matter drives everything; `content/README.md` has the full list. The
essentials: `title`, `date`, `categories` (first entry is one of the six
regions), `tags`, `description`, and optional `image`, `pin`, `draft`.

`description` is the summary, 120 to 180 words, used as the meta description
and as the blurb on the homepage map. Required from 2026-08-15 onwards; older
posts fall back to their opening paragraph.

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

Repeatable procedures live as skills in `.claude/skills/`. Writing an article
end to end is `write-article`, which calls `review-article` and `linkedin-post`
and leans on `publish-article` for the mechanics. `styling` covers CSS work.
Add one when a job is done more than once.

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
