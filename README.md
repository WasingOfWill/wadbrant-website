# Blog Commands & Reference

## Terminal Commands

### Content Management
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

### Local Development
```bash
# Start local server (without drafts)
bundle exec jekyll serve

# Start server with drafts visible
bundle exec jekyll serve --drafts

# Start server with drafts and auto-reload
bundle exec jekyll serve --drafts --livereload

# View site at http://localhost:4000
```

### Setup
```bash
# Install dependencies
bundle install
```

## Drafts vs Articles

**Drafts:**
- Stored in `_drafts/` folder
- No date in filename required
- Not visible on the live site
- Perfect for work in progress
- Preview with `bundle exec jekyll serve --drafts`

**Articles:**
- Stored in `_posts/` folder
- Require date in filename (YYYY-MM-DD-title.md)
- Visible on the live site immediately
- Should be complete and ready for public viewing

## Front Matter Template

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

## Content Guidelines

### Categories & Tags
- Categories: Maximum 2 levels deep
- Tags: Use lowercase, can have multiple
- Both help with navigation and SEO

### Images
1. Place images in: `assets/images/posts/YYYY-MM-DD-title/`
2. Reference in post:
```markdown
![Alt text](/assets/images/posts/YYYY-MM-DD-title/image.jpg)
```

### Linking Between Posts
```markdown
[Link text]({% post_url YYYY-MM-DD-post-name %})
```
Example:
```markdown
[See my first post]({% post_url 2025-09-18-why-indie-games-fail %})
```

**Important:**
- Don't include the .md extension
- Use the exact filename without the extension
- The post must exist for the link to work

## Publishing Schedule

Plan to publish twice a week:

### Post Types
- **Personal experiences**: Life lessons, insights
- **Technical posts**: Tutorials, project walkthroughs
- **Portfolio pieces**: Showcasing your work
- **Opinion pieces**: Your thoughts on industry topics
- **Quick thoughts**: Shorter posts, observations

### Content Calendar
- **Monday**: Technical/tutorial content
- **Thursday**: Personal/opinion pieces

## SEO and Analytics

### Google Analytics
Add your Google Analytics ID to `_config.yml`:
```yaml
google_analytics: G-XXXXXXXXXX
```

### SEO
The site includes `jekyll-seo-tag` plugin which automatically:
- Generates meta tags
- Creates Open Graph tags
- Adds JSON-LD structured data
- Generates sitemap

## Troubleshooting

### Build Failures
- Check the Actions tab in your GitHub repository
- Ensure all front matter is properly formatted
- Validate your `_config.yml` syntax

### Domain Issues
- DNS changes can take 24-48 hours to propagate
- Verify CNAME file contains only your domain (no http://)
- Check GitHub Pages settings in repository

### Installing Ruby on Windows (required to build, not to edit)
1. Download Ruby+Devkit from [rubyinstaller.org](https://rubyinstaller.org/)
2. Run the installer and select "Add Ruby executables to your PATH"
3. Open a new PowerShell window
4. Install bundler: `gem install bundler`
5. Navigate to your blog directory and run `bundle install`