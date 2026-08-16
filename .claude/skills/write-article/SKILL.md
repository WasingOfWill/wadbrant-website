---
name: write-article
description: Take a piece of source material and turn it into a published article on wadbrant.com. Use when given notes, a transcript, a Google Doc link, a local file or a rough idea and asked to write, draft, or publish a post. Runs the whole pipeline: questions, draft, review, media, scheduling, deploy and the LinkedIn post.
---

# Writing an article

End to end, from a pile of source material to a post that is live and a
LinkedIn draft waiting for the author. Twelve steps. Do not skip the questions
and do not skip the review; those are the two that decide whether the piece
sounds like Will or like a language model.

Two other skills do part of the work: `review-article` at step 6 and
`linkedin-post` at step 12. Invoke them rather than doing their job here.

## 1. Take the source

The source is a local file, a pasted document, or a link. For a Google Drive or
Docs link, ask for it as a file or as pasted text: there is no credentialled
access to Drive from here, and guessing at the contents of a link is worse than
asking.

Read the whole thing before writing anything. If it is a transcript, note what
was said in passing but meant strongly, because that is usually the article.

## 2. Ask between three and ten questions

Never fewer than three. Ask about intent, not about grammar. Good ones:

- Who is this for: someone in the industry, or someone outside it?
- What should a reader do or believe differently afterwards?
- Is there a claim here you want to be the headline, or a story you want
  remembered?
- Anything in the source that must not be published: names, numbers, an
  employer's confidential detail?
- Is this a standalone or part of a series?
- How strong do you want the opinion? Will's writing gets sharper when he is
  annoyed; the source often does not show how annoyed he is.

Wait for the answers. Batch them into one message; do not drip-feed.

## 3. Read the reference material

Every time, not just the first time:

- `writing/writing-style-guide.md`, the voice in detail.
- `writing/post-template.md`, the front matter and markdown shapes.
- Two or three existing posts in `content/posts/` that are closest in subject,
  to see what has already been done and how it opened.

Note how those posts are structured, because step 6 checks that this one is not
built the same way.

## 4. Write the first draft

Write it into `content/posts/` with `draft: true` from the start. It stays out
of the site, renders at its real URL so it can be read in place, and shows up
on `/drafts/`. Drop the flag at step 9.

Front matter first:

- `title`: title case, no colon-subtitle construction unless the source has one.
- `date`: from `npm run slot`, which decides for you. See step 9.
- `categories`: exactly the six on the map, plus at most one second-level.
  `reference.md` has the table. Do not invent a new one.
- `tags`: reuse existing spellings. Every new string becomes its own page.
- `image.path` and `image.alt`: the cover, a placeholder for now.
- `description`: the summary, 120 to 180 words. It is the meta description
  Google shows and the blurb on the homepage map, so write it as prose that
  stands on its own, and make the first sentence work alone because search
  results cut off around 155 characters. It is not the first paragraph of the
  article rewritten.

Then the body. Will's articles are conversational, first person, specific with
numbers, and willing to have an opinion. The house rules in `CLAUDE.md` about
bold and em dashes govern the interface and the docs, not the articles: the
style guide governs the articles, and it calls for both.

## 5. Structure and media

Structure so it can be skimmed: headings that say something, short paragraphs,
a list where a list helps, a table where a table helps. Do not use the same
skeleton as the last post.

Media goes in a folder of its own, named for the slug, created now and left for
the author to fill:

```bash
mkdir -p public/assets/posts/<slug>
```

The cover is `cover.png`. Inline images are numbered in the order they appear:
`01.png`, `02.png`. Reference them where the article wants them, with real alt
text:

```markdown
![A Steam store page showing the review count](assets/posts/<slug>/01.png)
```

While the picture does not exist yet, name the file `placeholder-01.png` and
point at that. `tests/content.mjs` fails a published post that still has one,
so a placeholder cannot reach the site by accident, and a draft can carry as
many as it likes. Tell the author which number is which, because `01.png` says
nothing about what should be in it.

An article may only use its own folder, plus `assets/site/`. If two pieces want
the same picture, copy it into both.

## 6. Review the draft

Invoke `review-article` on the file. It reads language, voice, structural
sameness against the other posts, and the factual claims. Do not review your
own draft by eye instead; the point of a separate pass is that it is separate.

## 7. Act on the review

Fix everything it raised or say why not. If a fix would change what the article
argues, that is a question for the author, not a decision to make quietly.

## 8. Hand it over

Give the author:

- the file path and the URL it will publish at
- the media folder path and a list of what goes in it
- anything the review flagged that needs a human: a fact to confirm, a name to
  clear, a number to check

Stop here. Do not schedule or push before sign-off.

## 9. Schedule it

```bash
npm run slot
```

Remove `draft: true` and set the date it gives you. Today if today is free,
otherwise two days past the last date already booked, stepping until it finds a
gap. It reads the filenames in
`content/posts/`, so a post staged for the future counts as booked. Rename the
file and set `date` to match; the filename is the URL and the date is what
publishes it.

## 10. Final checks

```bash
npm run optimize:images
npm run verify
```

Then look at the rendered post, not just the test output:

```bash
npm run dev
```

Confirm the cover appears, every inline image is real, no `placeholder-`
survives, the description reads well, and the post shows up where it should on
the homepage map.

## 11. Ship

Commit the post, its images and nothing else, then push to `main`. Vercel
deploys. `publish-article` has the detail on images and redirects.

## 12. The LinkedIn post

Invoke `linkedin-post` with the article. It produces a draft for the author to
paste; posting it is manual.

## Afterwards

If this run deviated from these instructions because of something the author
said, or if something here turned out to be wrong or missing, ask whether to
fold it back in, and then do it. That includes new tags, a new second-level
category, a voice preference the style guide does not cover, and anything the
review caught twice. A pipeline that does not learn is a pipeline that gets
re-explained every time.

## Not automated

Substack and LinkedIn both have write APIs, and neither is wired up here.
Substack has no public posting API; the practical route is its email-to-post
address or an RSS import pointed at `/feed.xml`, which would make crossposting
automatic in one direction. LinkedIn needs an approved app and an OAuth token
with `w_member_social`. Both are worth doing and both need credentials that do
not exist in this repository yet. Say so rather than pretending.
