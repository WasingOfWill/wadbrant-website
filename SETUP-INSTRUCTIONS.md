# Complete Jekyll Blog Setup Instructions

Your Jekyll blog is now ready! Follow these steps to get it live on your domain.

## Step 1: Upload to GitHub

1. Create a new repository on GitHub:
   - Go to [github.com](https://github.com) and click "New repository"
   - Name it something like `your-blog-name` or `personal-blog`
   - Make it **public** (required for free GitHub Pages)
   - Don't initialize with README (we have one already)

2. Upload your files:
   ```bash
   git init
   git add .
   git commit -m "Initial blog setup"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

## Step 2: Configure GitHub Pages

1. In your GitHub repository, go to **Settings**
2. Scroll down to **Pages** in the left sidebar
3. Under **Source**, select **GitHub Actions**
4. The site will automatically build and deploy

## Step 3: Set Up Your Custom Domain

### Update CNAME file
1. Edit the `CNAME` file in your repository
2. Replace `yourdomain.com` with your actual domain

### Configure DNS at your domain registrar
Add these DNS records:

**A Records (point @ to GitHub's IPs):**
- Type: A, Name: @, Value: 185.199.108.153
- Type: A, Name: @, Value: 185.199.109.153  
- Type: A, Name: @, Value: 185.199.110.153
- Type: A, Name: @, Value: 185.199.111.153

**CNAME Record (for www subdomain):**
- Type: CNAME, Name: www, Value: yourdomain.com

### Enable HTTPS in GitHub Pages
1. Back in GitHub Settings → Pages
2. Check "Enforce HTTPS" (may take a few minutes to become available)

## Step 4: Customize Your Site

Edit `_config.yml` and update these fields:
```yaml
title: Your Blog Title
email: your-email@example.com
description: Your blog description
url: "https://yourdomain.com"
twitter_username: your_twitter
github_username: your_github
```

Update the author name in the post defaults section:
```yaml
defaults:
  - scope:
      path: ""
      type: "posts"
    values:
      layout: "post"
      author: "Your Real Name"
```

## Step 5: Customize the About Page

Edit `about.md` and replace the placeholder content with:
- Your background and experience
- What you write about
- Your contact information
- Any other relevant details

## Step 6: Write Your First Real Post

1. Delete or edit the example posts in `_posts/`
2. Create a new post: `_posts/2024-01-XX-your-first-post.md`
3. Use this template:

```markdown
---
layout: post
title: "Your Post Title"
date: 2024-01-XX 10:00:00 +0000
categories: personal
tags: [blogging, introduction]
author: Your Name
---

Your post content here...
```

## Writing Workflow Recommendations

### Option 1: GitHub Web Interface (Easiest)
- Edit files directly on GitHub.com
- Click "Create new file" in `_posts/` folder
- Commits automatically trigger rebuilds
- Best for quick posts

### Option 2: Local Development (Most Flexible)
- Install Ruby and Jekyll locally (see README.md)
- Write posts in your preferred editor
- Preview changes with `bundle exec jekyll serve`
- Push to GitHub when ready

### Option 3: GitHub Desktop + Editor (Balanced)
- Use GitHub Desktop for Git operations
- Write in VS Code, Typora, or other Markdown editor  
- Best if you prefer GUI tools

## Customization Tips

### Changing Colors
- Edit `assets/css/style.scss`
- Modify the `$brand-color` variable
- Reload your site to see changes

### Adding New Pages
- Create `.md` files in the root directory
- Add proper front matter with layout and title
- They'll automatically appear in the navigation

### Adding Images to Posts
1. Upload images to `assets/images/`
2. Reference in posts: `![Alt text](/assets/images/filename.jpg)`
3. For more control: `<img src="/assets/images/filename.jpg" alt="Alt text" class="post-image center">`

## Troubleshooting

### Site Not Building
- Check the **Actions** tab in your GitHub repository
- Look for error messages in the build logs
- Ensure all YAML front matter is properly formatted

### Domain Not Working
- DNS changes take 24-48 hours to propagate
- Verify CNAME file contains only your domain (no http://)
- Check that DNS records are configured correctly

### Local Development Issues
- Ensure Ruby and bundler are installed correctly
- Run `bundle install` if you get dependency errors
- Try `bundle update` if gems are outdated

## Next Steps

1. Complete the setup steps above
2. Write and publish your first post
3. Share your blog on social media
4. Consider adding Google Analytics for tracking
5. Engage with other bloggers in your niche

Your blog is now ready to go live! The setup includes everything you need for a professional-looking, customizable blog that you fully control. 