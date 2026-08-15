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

`/` is deliberately empty for now. The article list lives at `/articles/`.
Tags have no index of their own: the tag cloud sits at the bottom of
`/categories/`, and `/tags/` redirects there. Individual tag pages still exist.

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

Four things that have already cost an afternoon each.

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
