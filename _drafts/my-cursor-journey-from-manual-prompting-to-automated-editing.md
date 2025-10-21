---
layout: post
title: "My Cursor Journey: From Manual Prompting to Automated Editing"
date: 2025-10-20
categories: [Product Management, AI]
tags: [Using LLMs, Product Management, Doing Things]
image:
  path: assets/images/article/cursor-journey.png
---

There's a recurring pain point in content creation that we all quietly accept:

*Manual editing is tedious.*

You write a blog post. You read it through once, twice, maybe three times. You catch some typos, fix some grammar, adjust a few sentences. But you know it could be better. You just don't have the time to perfect every single article.

For years, the fix has been "better editing skills" or "more time." It's fairly standard. But I don't think it has to be.

## This Article
*I went from manually prompting Cursor to edit my articles to having a fully automated system that improves my writing with one sentence. The journey took me through 10+ iterations, taught me how AI learns from context, and ultimately saved me hours per article while improving quality.*

## The Manual Prompting Phase

It started simple enough. I had written a few blog posts for wadbrant.com and wanted them to be better. So I opened Cursor and started asking it to edit my articles.

"Please improve the writing quality of this article."

That was my first prompt. Generic, vague, and predictably useless.

The AI made changes, sure. But they felt... off. Too formal where I wanted casual. Too wordy where I wanted punchy. It was editing *a* blog post, not *my* blog post.

I spent the next few weeks manually prompting. "Make it more conversational." "Fix the grammar but keep my voice." "Improve the flow between paragraphs." Each prompt got slightly more specific, but I was still starting from scratch every time.

The breakthrough came when I realized I wasn't just editing articles—I was teaching the AI how I write.

## Learning What Actually Works

After editing about 15 articles manually, patterns started emerging. The AI was getting better at understanding my voice, but only when I gave it the right context.

I discovered that "make it sound like me" was useless, but "use shorter sentences for impact, add personal anecdotes, and keep the conversational tone" worked. I learned that the AI needed specific examples of my writing style, not just descriptions.

The real game-changer was when I started including excerpts from my best-performing articles in the prompt. Instead of describing my style, I showed it.

"Edit this article to match the voice and style of these examples: [insert 3-4 paragraphs from my best articles]"

Suddenly, the edits felt like me. The AI was picking up on my specific patterns—how I use em dashes, when I drop in "Ouch." for emphasis, my tendency to follow complex explanations with simple truths.

## The 10x Experiment

Here's where it got interesting. I had about 20 articles that needed editing, and I was tired of the back-and-forth. So I decided to try something different: edit all of them in one massive context window.

I loaded up 10 articles at once and asked Cursor to edit them all, using the same style examples I'd refined. The AI processed them sequentially, and something fascinating happened.

By the third article, the AI was already improving. By the seventh, it was making edits I hadn't even thought to ask for. By the tenth, it was catching patterns I didn't know I had.

The AI was learning in real-time. Each article taught it something about my writing that it applied to the next one. The consistency improved dramatically as it went through the batch.

## The AI Writes Its Own Prompt

This was the moment I knew I was onto something. After processing 10+ articles, I asked the AI to analyze what it had learned and write a new, improved prompt for editing my articles.

The prompt it generated was better than anything I'd written manually. It captured nuances I hadn't even articulated to myself:

"Edit articles to match Will's voice: Use short, punchy sentences for impact. Follow complex explanations with simple truths. Use em dashes for parenthetical thoughts. Include personal anecdotes and industry insights. Balance technical knowledge with conversational tone. Use 'I' frequently to share experience. End sections with simple, direct statements."

It was like having a writing coach who had studied every word I'd ever published.

## Building the System

I created a simple system: a markdown file with my best prompts, updated regularly based on what worked. But the real breakthrough came when I realized I could distill everything into a single instruction file.

The `EDIT-LLM.md` file became my secret weapon. Instead of complex prompts, I could just say "Edit this article" and reference the instruction file. The AI would read my style guide, understand the specific formatting rules, and apply everything consistently.

But I wanted to go further.

## One-Sentence Triggers

The next evolution was making it even simpler. I wanted to be able to trigger editing with just one sentence, integrated into my normal workflow.

"Edit this article using my style guide."

That's it. One sentence. The AI would read the instruction file, understand the context, and make the edits. No complex prompting, no back-and-forth, no thinking about what to ask for.

I integrated this into my commit workflow. Every time I committed an article, it would automatically get edited. When I moved a draft to published, it would get a final polish pass.

## The Automation Layer

The final piece was making it truly automated. I set up a system where the AI could not only edit articles but also improve the instruction file itself.

"Add to writing style.md" became a command that would analyze the edits made and update the style guide with new patterns it discovered. The system was now self-improving.

I could write a rough draft, commit it, and by the time I came back, it would be polished, consistent, and ready to publish. The AI had learned my voice so well that I barely needed to review the changes.

## The Results

The numbers speak for themselves:

- **Time saved**: From 2-3 hours per article to 15 minutes
- **Consistency**: Every article now follows the same high-quality standards
- **Quality improvement**: My writing has become more polished without losing my voice
- **Automation**: 90% of my editing is now hands-off

But the real win is something harder to measure. I can now focus on ideas and content instead of getting bogged down in editing. I write more because editing is no longer a barrier. The AI handles the tedious work while I focus on what matters.

## What I Learned

This journey taught me several important lessons about working with AI:

### 1. Context is Everything
The AI didn't get better because I wrote better prompts. It got better because I gave it more context. Showing examples of my writing was infinitely more valuable than describing my style.

### 2. AI Learns in Batches
Processing multiple articles in one session created a learning effect that single-article editing couldn't match. The AI built up knowledge about my patterns and applied them consistently.

### 3. Simplicity Scales
The most powerful system was also the simplest. One instruction file, one sentence triggers, automated workflows. Complexity was the enemy of consistency.

### 4. AI Can Write Better Prompts Than Humans
When I asked the AI to analyze its own work and write a new prompt, the result was better than anything I could have written manually. It understood the patterns better than I did.

### 5. Automation Unlocks Creativity
Once editing became automated, I could focus on what I actually wanted to do: write about the game industry, share insights, and help other developers.

## The Current System

Today, my editing workflow looks like this:

1. Write a rough draft
2. Commit with "Edit this article using my style guide"
3. Review the changes (usually minimal)
4. Publish

The AI handles grammar, consistency, formatting, and voice. I handle ideas, structure, and content. It's a perfect division of labor.

## For Other Content Creators

If you want to replicate this approach, here's what I'd recommend:

### Start Small
Begin with manual prompting on a few articles. Learn what works and what doesn't. Don't try to automate everything at once.

### Show, Don't Tell
Instead of describing your writing style, show the AI examples of your best work. Context beats description every time.

### Batch Process
Edit multiple articles in one session. The AI learns better when it can see patterns across multiple pieces.

### Let AI Write the Prompts
Once you have good examples, ask the AI to analyze them and write its own editing prompt. It will probably be better than yours.

### Automate Gradually
Start with simple automation, then add complexity. The goal is to make editing effortless, not to build a complex system.

## The Future

I'm still improving the system. The AI continues to learn new patterns, and I'm finding new ways to integrate it into my workflow. But the foundation is solid: a system that understands my voice, applies it consistently, and gets better over time.

The real insight isn't about AI or editing—it's about finding the right division of labor between human creativity and machine consistency. Let the AI handle what it's good at (pattern recognition, consistency, formatting) so you can focus on what you're good at (ideas, insights, storytelling).

That's the future of content creation. Not AI replacing humans, but AI amplifying what humans do best.

And honestly? It's pretty freaking cool.
