# wadbrant.com

Personal site of Will Wadbrant — articles on product management, the gaming
industry and AI. Next.js 15 (App Router) + Markdown content, deployed on Vercel.

It replaces a Jekyll site. The design was carried over pixel for pixel, but
nothing of the old theme's machinery remains: the stylesheets, components and
content pipeline are all in this repository and meant to be edited.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4000
npm run build    # production build
npm start        # serve the production build
```

## Publishing an article

1. Add `content/posts/YYYY-MM-DD-my-post.md` (or run `npm run new -- "Title"`).
2. Commit and push.
3. Vercel builds and deploys it.

Front matter reference: [`content/README.md`](content/README.md).

Everything is statically generated at build time, so there is no database, no
CMS and no runtime cost — a push is the entire publishing pipeline, which is
what makes it easy to drive from a script or an agent.

## Layout

```
content/            Markdown — the only thing you edit to publish
  posts/            articles
  pages/            about, cv
  drafts/           unpublished work in progress
writing/            style guide and the AI editing workflow
public/assets/      images, fonts, favicons (URLs match the old site)
src/
  app/              routes (home, posts, tags, categories, archives, about, cv,
                    feed.xml, sitemap.xml, robots.txt, search.json)
  components/       Sidebar, Topbar, Panel, PostCard, Toc, search, …
  lib/
    site.ts         site title, nav, social links, analytics id
    posts.ts        reads content/, derives tags, categories, archives, related
    markdown.ts     Markdown → HTML pipeline
  styles/
    globals.css     load order + local overrides
    theme.css       design tokens and every component's look
    layout.css      grid, flex and spacing utilities
    fonts.css       self-hosted Lato / Source Sans Pro
```

### Where to change things

| I want to… | Edit |
| --- | --- |
| change the title, tagline, social links | `src/lib/site.ts` |
| add or remove a sidebar entry | `navigation` in `src/lib/site.ts` |
| restyle something | `src/styles/globals.css` (keep `chirpy.css` untouched) |
| change how a post page is laid out | `src/app/posts/[slug]/page.tsx` |
| change the post card | `src/components/PostCard.tsx` |

## Features

- Post list, tags, categories (nested, collapsible), archives timeline
- Recently updated + trending tags panel, related posts, prev/next navigation
- Client-side search over a statically generated index (`/search.json`)
- Table of contents with active-section highlighting
- Light/dark mode toggle in the sidebar, remembered per browser, defaults to the
  OS preference
- Atom feed, sitemap, robots, Open Graph and JSON-LD metadata
- Fully static output, self-hosted fonts, no third-party CSS or JS at runtime

## Differences from the Jekyll site

- The AI and Portfolio pages are gone (`/ai` redirects to `/categories/ai`,
  `/product` to the home page).
- The home page lists every post; the old `/page2` URLs redirect to `/`.
- Reading time on two posts differs by a minute — Jekyll counted words in a
  non-deterministic way (sometimes the Markdown source, sometimes the rendered
  HTML). This site always counts the Markdown source.
- `cv.md` has one line (`**KTH …** | Stockholm`) that kramdown accidentally
  rendered as a one-row table; it is now a paragraph like the lines around it.
- Dates render in the site timezone on the server instead of being rewritten in
  the browser, so there is no flash of a different date on load.

## Deployment

Vercel project settings:

- **Root Directory:** the repository root
- **Framework preset:** Next.js
- **Build command / output:** defaults

Step-by-step instructions, including the DNS records for wadbrant.com, are in
[`DEPLOY.md`](DEPLOY.md).

`NEXT_PUBLIC_SITE_URL` may be set to override the canonical origin; it defaults
to `https://wadbrant.com`.
