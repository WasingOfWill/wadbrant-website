---
name: publish-article
description: Publish or update an article on wadbrant.com. Use when asked to add a post, turn a draft or document into an article, set front matter, add cover or inline images, or get a piece live. Handles scaffolding, images, verification and the commit.
---

# Publishing an article

The whole pipeline is files plus a push. Nothing else is involved.

## 1. Create the file

```bash
npm run new -- "The Title" --categories "Game Industry,Indie" --tags "Indie Games,Doing Things"
```

That writes `content/posts/YYYY-MM-DD-the-title.md` with valid front matter and
tells you the URL it will publish at. Writing the file by hand is fine too; the
naming rule is `YYYY-MM-DD-slug.md`, and the part after the date becomes the
slug.

If the source is an existing document, convert it to Markdown first and keep
the author's voice exactly. The writing rules in CLAUDE.md govern interface
copy and documentation, not the author's articles.

## 2. Front matter

`content/README.md` is the reference. What matters in practice:

- `categories` is ordered. The first entry is the top-level group on the
  categories page, the second is its child. Reuse existing groups rather than
  inventing new ones; check `/categories/` first.
- `tags` are flat and shared across the site. Reuse existing spellings, since
  each distinct string becomes its own tag page.
- `image.path` is the cover. It appears on the card, at the top of the post,
  and in the social preview.
- A date in the future keeps the post unpublished. That is the way to stage
  something.

## 3. Images

Put files under `public/assets/images/`, referenced as
`assets/images/...` with or without the leading slash. Source artwork should be
no wider than 1600px. Then:

```bash
npm run optimize:images
```

It re-encodes in place and never upscales or quantises photographs. Originals
are not kept in the repository, so optimise once and commit the result.

## 4. Verify

```bash
npm run verify
```

The content suite is the one that catches article mistakes: missing title or
date, duplicate slug, an image path that does not resolve, an internal link to
a route that does not exist. Fix and rerun until it passes. Do not commit an
article that has not been through it.

## 5. Ship

Commit the post and its images together, then push. Vercel builds and deploys
from `main`. For something that wants a look before it goes live, push a branch
instead and use the preview URL.

## Editing an existing article

Same loop, minus the scaffolding. Changing a title does not change the URL,
which comes from the filename; renaming the file does, and breaks inbound
links, so prefer leaving it alone or add a redirect in `next.config.mjs`.
