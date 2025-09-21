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

## Quick Commands

```bash
# Create a new post
bundle exec jekyll post "Your Post Title"

# Create a draft
bundle exec jekyll draft "Your Draft Title"

# Publish a draft
bundle exec jekyll publish _drafts/your-draft-title.md

# Unpublish a post (move to drafts)
bundle exec jekyll unpublish _posts/YYYY-MM-DD-your-post-title.md
```

## Front Matter Options

```yaml
---
title: Your Title Here
date: YYYY-MM-DD HH:MM:SS +/-TTTT
categories: [MainCategory, SubCategory]
tags: [tag1, tag2]     # always lowercase
image:
  path: assets/images/cover/...
  alt: Image description
math: true           # enable math support
mermaid: true       # enable mermaid diagrams
pin: true           # pin to top of posts list
comments: false     # disable comments
toc: false          # remove table of contents
---
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
# Start local server
bundle exec jekyll serve

# View site at
http://localhost:4000
```

## Writing Tips

1. Use drafts for work in progress
2. Preview locally before publishing
3. Include images with descriptive alt text
4. Use categories and tags consistently
5. Add a brief description in front matter

## File Organization

```
_posts/         # Published articles
_drafts/        # Work in progress
assets/images/  # Image files
templates/      # Post templates
```
