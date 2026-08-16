---
name: linkedin-post
description: Write a LinkedIn post for a wadbrant.com article. Use when asked for a LinkedIn post, a social post or a share blurb for a piece, and as step 12 of write-article. Produces a casual draft in Will's voice ending in a read-more link.
---

# The LinkedIn post

One post, ready to paste. It has to sound like a person typing on a phone
between meetings, not like a brand account. If it reads as marketing, it has
failed, and no amount of polish fixes that.

## Read the article first

The whole thing, from `content/posts/`. The post is not a summary of the
article; it is the one thing from the article that was worth saying out loud,
said in Will's words, with the article as the place to go for the rest.

## Shape

- Open with the point, or with the specific thing that prompted it. No
  throat-clearing, no "I've been thinking a lot about", no "excited to share".
- Six to twelve short lines. Line breaks between them: LinkedIn collapses
  paragraphs and the post gets read on a phone.
- Around 120 to 200 words before the link. Long enough to be worth stopping
  for, short enough that the "see more" fold does not cut the point in half.
  Put something worth reading in the first two lines, because that is all that
  shows before the fold.
- One concrete number or one concrete story. Will's writing lands when it is
  specific; a general observation about the industry is a scroll.
- An actual opinion. If the post could have been written by anyone who read the
  article, rewrite it.
- End with the link, plainly: `Read the rest: https://wadbrant.com/posts/<slug>/`

## Never

- Emoji as bullet points, or a row of them anywhere.
- Hashtag stacks. Two at most, and only if they are how the industry actually
  tags the subject.
- "Thoughts?", "What do you think?", "Drop a comment below". If the post is
  interesting people will reply without being asked.
- "I'm thrilled", "I'm humbled", "game-changer", "deep dive", "unpack".
- Claiming something the article does not say, or a number the article does not
  have.
- Rewriting the article's opening paragraph. They will be read together.

## Output

Print the post as plain text in a code block so it can be copied without
markdown getting in the way, and nothing else after it except one line saying
what to check before posting if anything in it needs confirming.

Posting is manual. LinkedIn's API needs an approved application and a token
with `w_member_social`, and there are no credentials for it in this repository.
If automatic posting is wanted, that is the thing to go and get; say so rather
than implying the post went out.
