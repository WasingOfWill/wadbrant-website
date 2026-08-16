---
name: publish-article
description: The mechanics of getting an article onto wadbrant.com: front matter, scheduling, images, verification and the push. Use when adding or updating a post directly, or as steps 9 to 11 of write-article. For writing a piece from source material, use write-article instead.
---

# Publishing an article

The moving parts, not the writing. `write-article` is the pipeline that calls
this; this is what it calls.

## Create the file

```bash
npm run new -- "The Title" --categories "Gaming,Design" --tags "Game Dev,Doing Things"
```

That writes `content/posts/YYYY-MM-DD-the-title.md` with valid front matter and
prints the URL it will publish at. Writing the file by hand is fine; the naming
rule is `YYYY-MM-DD-slug.md`, and the part after the date becomes the slug.

## Front matter

`content/README.md` is the full reference. What matters in practice:

- `categories` is ordered and the first entry is one of the six on the homepage
  map: AI, Gaming, News, Product, Projects, Misc. At most one second-level
  entry after it, and there are only three of those. The table is in
  `reference.md`. Inventing a seventh region silently changes the map.
- `tags` are flat and shared. Reuse existing spellings; every distinct string
  becomes its own page.
- `description` is the summary, 120 to 180 words. It is the meta description
  and the blurb on the homepage map. Required for anything dated from
  2026-08-15 onwards, which `tests/content.mjs` enforces.
- `image.path` is the cover: the card, the top of the post, the social preview.
- `draft: true` keeps it out of everything while it is being written.
- A date in the future keeps it out until the day arrives. That is how to stage.

Both still render at their own URL, marked and noindex, and both are listed at
`/drafts/`. There is no separate drafts folder; the flag is the difference.

## When it goes out

```bash
npm run slot
```

Today if today is free, otherwise two days past the last date already on the
calendar, stepping until it finds a gap. It reads the filenames, so a staged
post counts as booked. Put the answer in both the filename and `date`.

Do not work the date out by hand. It is the kind of arithmetic that is wrong
one day in ten and invisible afterwards.

## Images

Each article gets a folder named for its slug, holding everything it uses and
nothing else:

```
public/assets/posts/<slug>/cover.png
public/assets/posts/<slug>/01.png
public/assets/posts/<slug>/02.png
```

The numbers are the order the images appear in the piece. Reference them as
`assets/posts/<slug>/...`, with or without the leading slash. An article may
only use its own folder plus `assets/site/`, and the content suite fails a
stray path, an unused file and a folder with no article.

Source artwork no wider than 1600px. Then:

```bash
npm run optimize:images
```

It re-encodes in place across the whole asset tree, skipping fonts and
favicons, and never upscales or quantises a photograph. Originals are not kept
in the repository, so optimise once and commit the result.

Anything not yet real keeps `placeholder-` in its filename. A published post
that still has one fails the content suite, so a placeholder cannot reach the
site by accident.

## Verify

```bash
npm run verify
```

The content suite is the one that catches article mistakes: missing title or
date, duplicate slug, an image path that does not resolve, an internal link to
a route that does not exist, a surviving placeholder, a missing description.
Fix and rerun. Do not commit an article that has not been through it.

Then look at it rendered, with `npm run dev`. The suite cannot tell you that a
cover is the wrong crop.

## Ship

Commit the post and its images together, then push to `main`. Vercel builds and
deploys. For something that wants a look first, push a branch and use the
preview URL.

## Editing an existing article

Same loop, minus the scaffolding. Changing a title does not change the URL,
which comes from the filename. Renaming the file does, and breaks inbound
links, so either leave it or add a redirect in `next.config.mjs`, which is
where every retired URL already points.
