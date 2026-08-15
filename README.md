# wadbrant.com

Personal site of Will Wadbrant. Articles on product management, the gaming
industry and AI. Next.js 15 with Markdown content, deployed on Vercel.

Start with [`reference.md`](reference.md) if you are here to change something.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4000
npm run verify   # build, then every automated check
```

## Publishing an article

1. Add `content/posts/YYYY-MM-DD-my-post.md`, or run `npm run new -- "Title"`.
2. Commit and push.
3. Vercel builds and deploys it.

Front matter reference: [`content/README.md`](content/README.md).

Everything is generated at build time, so there is no database, no CMS and no
runtime cost. A push is the entire publishing pipeline, which is what makes it
easy to drive from a script or an agent.

## Where to change things

| I want to | Edit |
| --- | --- |
| change the title, tagline, social links | `src/lib/site.ts` |
| add or remove a sidebar entry | `navigation` in `src/lib/site.ts` |
| restyle a component | `src/styles/globals.css` |
| change a colour | the tokens in `src/styles/theme.css` |
| change the post page | `src/app/posts/[slug]/page.tsx` |
| change the post card | `src/components/PostCard.tsx` |

## Features

- Post list, tags, categories (nested and collapsible), archives timeline
- Recently updated and trending tags panel, related posts, previous and next
- Client-side search over a statically generated index
- Table of contents with active-section highlighting
- Light and dark mode, remembered per browser, defaulting to the OS preference
- Atom feed, sitemap, robots, Open Graph and JSON-LD metadata
- Fully static output, self-hosted fonts, no third-party requests at runtime

## Verification

`npm run verify` runs the build and then every check: writing rules, content
integrity, built output including a link crawl, and browser-driven interface
tests. See [`tests/README.md`](tests/README.md).

## Deployment

Vercel builds from the repository root on every push to `main`. Details and DNS
in [`DEPLOY.md`](DEPLOY.md).
