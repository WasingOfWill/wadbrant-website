# Content

Everything the site publishes lives here as plain Markdown. Add a file, commit,
push — Vercel builds and deploys it.

```
content/
  posts/    articles, one file per post
  pages/    standalone pages (about, cv)
```

## Post file names

```
content/posts/YYYY-MM-DD-slug-of-the-post.md
```

The date prefix is only a naming convention; the `date:` field in front matter
decides ordering. The part after the date becomes the URL:
`2025-09-18-why-indie-games-fail.md` → `/posts/why-indie-games-fail/`.

## Front matter

```yaml
---
title: "Why 90% of Indie Games Fail"      # required
date: 2025-09-18 09:00                    # required; site timezone is America/New_York
categories: [Game Industry, Indie]        # first entry is the top-level group
tags: [Product Management, Indie Games]   # free-form, drives /tags/
image:                                    # optional cover, shown on cards and OG
  path: assets/images/cover/example.png
  alt: "Steam store page for Yaengard"
pin: true                                 # optional, floats the post to the top
description: "Overrides the auto excerpt for SEO."   # optional
toc: false                                # optional, hides the contents panel
published: false                          # optional, keeps it out of the build
slug: custom-url                          # optional, overrides the file name
---
```

Notes:

- Posts dated in the future are not published — the same rule Jekyll used.
- Image paths may be written with or without a leading slash.
- Markdown is CommonMark + GFM, with typographic quotes and dashes applied
  automatically, so `"quotes"` and `--` come out looking right.
- The kramdown attribute syntax the old site used still works, e.g. a blockquote
  followed by `{: .prompt-tip }`.
- `.mdx` files are supported too if a post ever needs a component.

## Pages

`content/pages/about.md` and `content/pages/cv.md` back `/about/` and `/cv/`.
They use the same Markdown pipeline and may contain raw HTML.

## Creating a post

```bash
npm run new -- "My Great Title" --categories "AI,Product Management" --tags "AI" \
              --image assets/images/cover/default.png
```
