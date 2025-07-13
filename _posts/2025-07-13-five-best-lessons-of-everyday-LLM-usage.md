---
layout: post
title: "Five greatest tips for LLMs"
date: 2025-07-13
categories: [AI, Using LLMs]
tags: [AI, LLM, Doing things]
---

Working as a Product Manager through the rise of AI in software development, I feel like I missed an opportunity to build the first AI products. I always try to be curious, and nearly instantly began using the early models; InstructGPT, ChatGPT 1.0, first versions of Grok. Even if I didn’t jump on the AI hype train for product features, I realized quite quickly that it wasn’t vaporware. It actively saves you time, if used correctly. AI models and LLM agents aren’t magic (“fancy autocomplete” isn’t too far off), but they can save an inhuman amount of effort when applied where they are a smidge away from magic.


## Learn when AI breaks by intentionally breaking them
Listening and reading what those who work deep in the AI / LLM space are saying, one of the fastests ways to improve your use of AI (both in simple workflow and coding) is learning when the models break. I found it to be absurdly accurate. People who dislike the use of AI, or who stop using it for day-to-day tasks usually (in my experience) try to use the tool for something it’s not good for (such as finding facts), and then write the entire concept of LLMs off.

Whenever you try a new type of task (examples being a new type of coding challenge or writing something new), try to push the model until it breaks. It’ll teach you what you can do, and what you can’t. Give it more ambitious tasks with way too much context, or with way too little contexts (although the latter risks hallucinations rather than failure), and see if the model breaks. Once you know the boundaries of what the model can do and what it can’t do, you’ll know when to use it. In the same way as any tool, really.

**Learning 1**
```text
Learn quickly when AI models and LLM agents are useful, and what tasks break them.
Do this by experimenting quickly, and recording what works and what does not.
```

## Give more context
AI models thrive on context. Provide as much as possible to ensure accurate outputs. Insufficient context leads to errors, while abundant context, paired with clear prompts, keeps the model focused.

When asking an AI to draft an email, include the recipient’s role, the email’s purpose, and relevant background details (such as prior responses or project context) to avoid generic or off-topic responses. By providing a lot of text you have written, you can also prompt it to use your writing style (if it has enough of your own writing).

**Learning 2**
```text
Context is critical for successful output.
Always make sure to give the LLM as much context as possible.
More context is usually better.
```

## Prompt quality changes everything
High-quality prompts drive better AI results. Vague or poor prompts lead to subpar outputs. To improve outcomes, ALWAYS ask the AI to break down complex tasks into smaller steps, clarify details through follow-up questions, and then address each step systematically.

My own prompt component (added to other prompts) for this is:
`“Break down this task into subtasks. Then, create a solution for each subtask itself. If at that point something is unclear, ask follow up questions about the original task. After doing all of those things, complete the task.”`

I have this prompt in my prompt library, iterating on it, and quickly adding it to other prompts.


**Learning 3**
```text
Framing prompts correctly massively impacts output quality. 
Epecially when there is a lot of context.
Write prompts in ways where the task is approached in the right way and the goal is not lost.
Ask the AI to break down the problem, and solve each subtask.
```


## Repeatable, tested, and accessible prompts

Writing prompts from scratch is time-consuming. A prompt library saves effort by storing reusable, tested prompts in an accessible format, like a customizable Notion page, for quick copying and pasting across devices.

Create a document or personal wiki with prompts which you often reuse. I organize mine under use cases, and keep generally useful prompts (such as the “break-down-problems-into-subtasks” above) easily accessible. Tools are just as good as they are easy to use.


**Learning 4**
```text
Providing the right context with the right framing takes a lot of time and cognitive effort.
Saving or automating recurring prompts makes all the difference in day-to-day practice.
```


## Speak to the LLM closer to its own language

Sometimes, data is lost in the context because the structure of the context isn’t appropriate.  Structured context, like markdown, JSON, or CSV, improves AI performance. Using machine-friendly formats ensures the model processes large amounts of context effectively, leading to better outputs.

When inputting customer data for analysis, use a CSV format like name,age,purchase;John,25,coffee instead of a plain text list to help the AI process it accurately. I especially like JSON or XML formats (and you can even use LLM prompts to turn data into this format)


**Learning 5**
```text
Speak the language an LLM speaks, especially when you have a lot of context.
When inputting a lot of context, find ways to use markdown languages, JSON, CSV, etc.
```

### BONUS: Find places where context export is available

Sometimes, the opportunity to make things blazing fast AI does not come from the work itself, just from the fact the right context can be exported quickly. 

Boost efficiency by exporting context in AI-compatible formats. Identify workflows where you can quickly extract and structure large amounts of context to unlock productive AI use cases. 

In a CRM system, export customer interaction logs as a JSON file to feed into an AI for generating personalized follow-up email suggestions. In meetings or video content, export the generated transcripts. In game development, consider building ways to export structured data.

Actively search for ways to export the right and large amount of context wherever you work. When you find a workflow where you can export the context in an AI-appropriate format, you’ll nearly always find great productive use-cases for AI/LLMs.


**BONUS**
```text
Always look for places where context is readily available and easily exportable.
There are likely places where AI can be a gamechanger there!
```

I often find new places where AI/LLMs can be game-changers not by finding the use-case, but simply looking for places where input/output is excellent and easy. Sometimes, it’s not about what you need improving, it’s about what is possible. LLMs can make things previously unthinkable doable, in raw convenience improvements. 

## Summary
As a summary, this leaves us with 6 learnings to 
Actively try to break AI agents and models, to learn what they can’t do.
Provide maximum possible context.

Prompt instructions matter a ton. Use well-tested and refined ones. Iterate on them.
Make your prompt framings accessible with a prompt library.
Whenever possible, give context in markdown languages or similar structures.

