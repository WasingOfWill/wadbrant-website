# Creating Blog Articles

## Drafts vs Articles

Drafts:
- Stored in `_drafts/` folder
- No date in filename required
- Not visible on the live site
- Perfect for work in progress
- Can be previewed locally using `bundle exec jekyll serve --drafts`
- Convert to article when ready using `publish` command

Articles:
- Stored in `_posts/` folder
- Require date in filename (YYYY-MM-DD-title.md)
- Visible on the live site immediately
- Should be complete and ready for public viewing
- Date determines display order on the blog

## Quick Commands ---------------------------------------------------

```bash
# Create a new post
bundle exec jekyll post "Your Post Title"

# Create a draft
bundle exec jekyll draft "Your Draft Title"

# Publish a draft
bundle exec jekyll publish _drafts/your-draft-title.md

# Unpublish a post (move to drafts)
bundle exec jekyll unpublish _posts/YYYY-MM-DD-your-post-title.md

## Local Development --------------------------------------------------

```bash
# Start local server (without drafts)
bundle exec jekyll serve

# Start server with drafts visible
bundle exec jekyll serve --drafts

# Start server with drafts and auto-reload
bundle exec jekyll serve --drafts --livereload

# View site at
http://localhost:4000

```

## Review articles jobs --------------------------------------------------

```bash
# Setup (first time)
bash jobs/setup.sh

# Review new/modified articles only
python jobs/content_review.py

# Force review all articles
python jobs/content_review.py --force

# Check what's been reviewed
cat jobs/checked_articles.json
```

## Front Matter Options ---------------------------------------------------

```yaml
---
layout: post
title: "Your Title Here"
date: YYYY-MM-DD
categories: [MainCategory, SubCategory]
tags: [tag1, tag2]    # always lowercase
image:
  path: assets/images/cover/image-name.png
  alt: Image description
---

# Optional Front Matter
math: true           # enable math support
mermaid: true       # enable mermaid diagrams
pin: true           # pin to top of posts list
comments: false     # disable comments
toc: false          # remove table of contents
```

## Categories & Tags

- Categories: Maximum 2 levels deep
- Tags: Use lowercase, can have multiple
- Both help with navigation and SEO

## Images

1. Place images in: `assets/images/posts/YYYY-MM-DD-title/`
2. Reference in post:
```markdown
![Alt text](/assets/images/posts/YYYY-MM-DD-title/image.jpg)
```

## Local Development

```bash
# Start local server (without drafts)
bundle exec jekyll serve

# Start server with drafts visible
bundle exec jekyll serve --drafts

# Start server with drafts and auto-reload
bundle exec jekyll serve --drafts --livereload

# View site at
http://localhost:4000
```

The `--drafts` flag will:
- Show all drafts as if they were posts
- Date them with today's date
- List them with your other posts
- Only show locally, not on the live site

## Writing Tips

1. Use drafts for work in progress
2. Preview locally before publishing
3. Include images with descriptive alt text
4. Use categories and tags consistently
5. Add a brief description in front matter

## Linking Between Posts

To link to another post in your blog:
```markdown
[Link text]({% post_url YYYY-MM-DD-post-name %})
```

Example:
```markdown
[See my first post]({% post_url 2025-09-18-why-indie-games-fail %})
```

Important:
- Don't include the .md extension
- Use the exact filename without the extension
- The post must exist for the link to work

## File Organization

```
_posts/         # Published articles
_drafts/        # Work in progress
assets/images/  # Image files
templates/      # Post templates
```
