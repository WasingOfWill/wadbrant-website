---
name: review-article
description: Review a draft article on wadbrant.com before it goes out. Use when asked to review, edit, proofread or sanity-check a post, and as step 6 of write-article. Checks voice, language, factual claims, front matter and whether the piece is built the same way as the last three.
---

# Reviewing an article

A separate pass, on purpose. The point is to read the draft as a reader rather
than as its writer, so read the file from disk rather than working from what
you remember writing.

Output one list of findings, each of them one line: what is wrong, where, and
what to do. No praise, no summary of the article back at the author. If nothing
is wrong in a section, say nothing about that section.

## Before reading the draft

Read `writing/writing-style-guide.md`. Then read the three most recent posts in
`content/posts/` by date, and write down for yourself how each one opens, how
it is structured, and how it ends. You are about to check that this draft is
not a fourth copy of that.

## 1. Voice

Against the style guide, not against a general idea of good writing:

- First person, conversational, speaking to one reader.
- Specific numbers where there is a claim. A percentage with no source, or a
  vague "many studios", is a finding.
- An actual opinion, held out loud. Hedged-into-nothing is a finding.
- Em dashes and bold are correct here. The no-bold, no-em-dash rules in
  `CLAUDE.md` are about the interface and the documentation, not the articles.
- Anything that reads as generated: a three-adjective list, "in today's
  landscape", a closing paragraph that restates the article, a heading that is
  a noun with no content in it.

## 2. Sameness

The strongest tell of a machine-written series is that every piece has the same
skeleton. Compare against the three recent posts and flag:

- The same opening move, for example a rhetorical question, three times running.
- The same section count and rhythm.
- The same closing move, for example a call to action or a summary list.
- A title built the same way as the last one.

Say which post it resembles and in what way. This is the check most worth
getting right; everything else here is caught by a spell checker eventually.

## 3. Facts

Every checkable claim, listed with a verdict:

- Numbers, percentages, dates, company names, product names, prices.
- Anything attributed to someone. Did they say it, and in that context?
- Anything time-sensitive that has moved on since the source was written.
- Links: do they resolve, and do they point at what the sentence says.

Where a claim cannot be checked from here, say so and mark it for the author
rather than quietly accepting it. A confident wrong number is worse than an
admitted gap.

## 4. Language

The mechanical pass, from `writing/EDIT-LLM.md`:

- Spelling, grammar, punctuation, hyphenation. "all right", not "alright".
- Product and game names spelled and capitalised as the guide has them.
- Space as the thousands separator: 10 000. Currency without: $1000. En dashes
  for ranges. Percent with no space: 70%.
- Headings in title case with lower-case filler words.
- "markdown" lower case in prose.

## 5. Front matter and structure

- `title` in title case, and the filename slug matching it closely enough.
- `date` matching the filename.
- `categories`: first entry one of the six regions, at most one second-level.
  The table is in `reference.md`. A seventh region or a fourth second-level
  category is a finding, not a decision to make here.
- `tags` reusing spellings that already exist across `content/posts/`.
- `description` present, 120 to 180 words, and readable on its own. Check the
  first sentence in isolation, because that is roughly what a search result
  shows.
- Headings that describe what is under them.
- Every image has real alt text.
- Placeholders still present are expected in a draft. List them so the author
  knows what to supply, but do not call them a defect.

## Finishing

Run the checks that do not need judgement:

```bash
npm run verify
```

Then add the filename to `writing/edited-articles.md`, which is the record of
what has been through this.

If the review turned up something the style guide should have said, propose the
line to add to it and ask before writing it in. The guide is the author's, not
yours.
