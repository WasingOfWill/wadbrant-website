# My Personal Blog

A Jekyll-powered blog hosted on GitHub Pages.

## Quick Start

### 1. Repository Setup
1. Create a new repository on GitHub (name it whatever you like)
2. Clone this repository content to your new repo
3. Push to GitHub

### 2. GitHub Pages Configuration
1. Go to your repository Settings
2. Navigate to "Pages" in the left sidebar
3. Under "Source", select "GitHub Actions"
4. The site will automatically build and deploy using the included workflow

### 3. Custom Domain Setup
1. In your repository, edit the `CNAME` file to contain your domain (e.g., `yourdomain.com`)
2. In your domain registrar's DNS settings, add these records:
   - Type: A, Name: @, Value: 185.199.108.153
   - Type: A, Name: @, Value: 185.199.109.153
   - Type: A, Name: @, Value: 185.199.110.153
   - Type: A, Name: @, Value: 185.199.111.153
   - Type: CNAME, Name: www, Value: yourdomain.com

### 4. Customize Your Site
Edit `_config.yml` and update:
- `title`: Your blog title
- `email`: Your email address
- `description`: Description of your blog
- `url`: Your custom domain
- `twitter_username`: Your Twitter handle
- `github_username`: Your GitHub username

## Writing Posts

### Creating a New Post
1. Create a new file in `_posts/` directory
2. Name it: `YYYY-MM-DD-title-of-post.md`
3. Add front matter (see examples in existing posts)
4. Write your content in Markdown

### Post Front Matter Template
```yaml
---
layout: post
title: "Your Post Title"
date: 2024-01-15 10:00:00 +0000
categories: category1 category2
tags: [tag1, tag2, tag3]
author: Your Name
---
```

### Adding Images
1. Place images in `assets/images/` directory
2. Reference in posts: `![Alt text](/assets/images/filename.jpg)`
3. Or use HTML for more control: `<img src="/assets/images/filename.jpg" alt="Alt text" class="post-image center">`

### Adding Videos
- **YouTube**: Use the embed code from YouTube
- **Self-hosted**: Place in `assets/videos/` and use HTML5 video tag

## Local Development

### Prerequisites
- Ruby (2.7+)
- Bundler

### Setup
```bash
# Install dependencies
bundle install

# Serve locally
bundle exec jekyll serve

# Visit http://localhost:4000
```

### Installing Ruby on Windows
1. Download Ruby+Devkit from [rubyinstaller.org](https://rubyinstaller.org/)
2. Run the installer and select "Add Ruby executables to your PATH"
3. Open a new PowerShell window
4. Install bundler: `gem install bundler`
5. Navigate to your blog directory and run `bundle install`

## Writing Workflow Options

### Option 1: Direct GitHub Editing
- Edit files directly on GitHub.com
- Commits automatically trigger site rebuilds
- Best for: Quick posts and minor edits

### Option 2: Git + Local Editor
- Clone repository locally
- Write posts in your favorite editor
- Commit and push to trigger rebuilds
- Best for: Longer posts and offline writing

### Option 3: GitHub Desktop + Editor
- Use GitHub Desktop for Git operations
- Write in VS Code, Typora, or other Markdown editor
- Best for: Those who prefer GUI tools

## Customization

### Changing Colors
Edit `assets/css/style.scss` and modify the `$brand-color` variable.

### Adding Pages
Create new `.md` files in the root directory with proper front matter.

### Modifying Layout
- Override theme files by creating files in `_layouts/`
- Add custom includes in `_includes/`
- See [Minima documentation](https://github.com/jekyll/minima) for details

## Publishing Schedule

Plan to publish twice a week. Here are some content ideas:

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

<!-- Build trigger - Bundle dependencies fixed - Jan 2025 -->
