---
layout: post
title: "Adding Images and Videos to Your Posts"
date: 2024-01-18 14:30:00 +0000
categories: [Tutorial, Blogging]
tags: [images, videos, markdown, html]
---

One of the great things about Jekyll is how easy it is to include multimedia content in your posts. Here's how you can add images and videos.

## Adding Images

### Method 1: Markdown Syntax
The simplest way to add an image is using Markdown:

```markdown
![Alt text for the image](/assets/images/my-photo.jpg)
```

### Method 2: HTML for More Control
If you need more control over sizing or styling, use HTML:

```html
<img src="/assets/images/my-photo.jpg" alt="Description" width="500" class="center">
```

### Example Image
![Jekyll Logo](https://jekyllrb.com/img/logo-2x.png)

## Adding Videos

### YouTube Videos
The easiest way to add videos is by embedding YouTube videos:

```html
<iframe width="560" height="315" 
        src="https://www.youtube.com/embed/VIDEO_ID" 
        frameborder="0" 
        allowfullscreen>
</iframe>
```

### Self-Hosted Videos
For videos you host yourself:

```html
<video width="100%" controls>
  <source src="/assets/videos/my-video.mp4" type="video/mp4">
  Your browser does not support the video tag.
</video>
```

## Organization Tips

### File Structure
I recommend organizing your media files like this:

```
assets/
  images/
    posts/
      2024-01-18-post-image.jpg
    general/
      profile-photo.jpg
  videos/
    demo-video.mp4
```

### Image Optimization
- Keep images under 1MB when possible
- Use appropriate formats (JPEG for photos, PNG for graphics)
- Consider using WebP for better compression
- Always include alt text for accessibility

## Styling Images

You can add custom CSS to style your images. Create a file `assets/css/style.scss`:

```scss
---
---

@import "jekyll-theme-chirpy";

.center {
  display: block;
  margin-left: auto;
  margin-right: auto;
}

.post-image {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
```

Then use the classes in your posts:

```html
<img src="/assets/images/example.jpg" alt="Example" class="post-image center">
```

Happy blogging! 