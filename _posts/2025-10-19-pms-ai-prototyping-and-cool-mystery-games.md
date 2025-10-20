---
layout: post
title: AI Prototyping a Mystery Games in 2 hours
date: 2025-10-19 07:37 -0400
image:
  path: assets/images/article/mysterygames/discovery.png
---


There's a recurring pain point in product teams that we all quietly accept:

*Miscommunication.* 

You describe a new feature or product vision.
You box out the user journey.
You write a PRD that tries to capture intent.
Then engineering builds something slightly different, design refines based on other assumptions, and by the time it hits staging, everyone realizes they weren’t actually aligned on the same vision. For years, the fix has been “clearer documentation” or “better tickets.” It’s fairly standard. But I don’t think it has to be. 

## Stop Explaining. Start Prototyping.

For some reason, prototyping has been seen as a designer's or engineer's job.
But that boundary doesn't make much sense anymore. I think it is everyone's job to prototype. Test, experiment, play around, and imagine. In the past it has been an engineering task because they can build, or a designer task because they can build in Figma. But with recent AI tools like v0 and Loveable, you can create simple visions really quick. Prototyping is now for everyone. Coming up with ideas and sharing their vision with others is now for everyone. Not just PMs either. Everyone.

## How I prototyped my Mystery Game

I love making games. It is in fact possibly my favorite thing in the world. Recently I have been researching the fundamental concepts of mystery game writing, and been writing one myself. I playtested it with pen-and-paper-and-a-friend, but wanted to try with 5-10 people for my 2nd iteration. Enter, Vercel v0.

![V0 AI Mystery Game](assets/images/article/other/v0Morthallow.png)
*I built Morthallow, Mystery Solving Game using $5 of free credits in v0 Vercel*

- First version in 5 minutes.
- 10 prompts and one hour later, it has all my bare minimum features.
- Then using Vercel's v0 git sync and a GitHub repo, I worked on it manually together with v0.
- 1 hour of jumping between my own coding with Cursor assist and v0 prompting.
- 3 hours total for the completed app, with 1 hour of building a system to auto-import my writing.
- 1-click deploy with Vercel.
- Linked it to 5 friends and got feedback within 10 minutes.
- One developer friend who instantly *got it* and was excited to build it with me.

Never had a project move that fast. Ever.

Is it buggy? Yes.

Does it work? Hell yes.

[Can anyone play it? Yes.](https://morthallow.vercel.app/)

## For Product Managers
I do think this is for everyone, but as a PM for a full team, I approach it around why it changes so much for product teams.

Shared context early.
AI prototypes give everyone a visual anchor. Designers see structure. Engineers understand complexity. Stakeholders get the "aha" moment sooner. Everyone gets to see the vision of what you're trying to create, allowing for feedback earlier.


### (1) Cheaper iteration.
You can explore five different versions of an idea before anyone touches production code. That saves time, and even more importantly, prevents tunnel vision. You also don't have to mind deployment or iteration, as the AI app building tools are built to reduce that friction to 0 (with drawbacks which do not matter to prototypes)


### (2) Fewer translation layers.
Most misalignment happens between words and visuals. A rough prototype removes that gap. It doesn't have to be perfect. We just need to share the vision more easily.

### (3) Faster feedback loops.
You can drop a prototype in Slack, test it with a few users, and refine your thinking in hours. The feedback becomes concrete, not theoretical.


## The New PM Skill
I do believe that in the next few years, “AI prototyping literacy” will become a core PM skill.

Not because we need to replace designers, but because we need to communicate visions faster and with fewer misunderstandings. Feedback needs to come earlier. Failures and flaws must be found earlier.

Imagine running a feature kickoff where instead of slides, you share a living, clickable flow that shows what users actually experience. Everyone’s energy shifts from “what are we building?” to “how can we make this better?”

![V0](assets/images/article/other/v0.png)
*v0, Loveable, or just Cursor. Basic project setup is absurdly easy today.*


## Start Small
It seems very daunting at first. Everyone is afraid to be replaced. You won't be. But you can become much better at what you do if you are brave enough to play around. It is a sandbox, and you have very little to lose.
If you're new to this, start with something simple:

Take your next feature idea.

Write out the flow in plain language in a document. Describe features, and the core value. The simplest, most stripped down version.

Use an AI design or app builder to visualize it. Give your design document to it.

Do 1-3 iterations with the AI. Back and forth. Test features. Make sure the prototype communicates the core value and vision of your idea. Then deploy and share it with other people. Flawed and instantly.

You'll notice something subtle happen: the conversation gets sharper, faster, and more collaborative. People "get it" in minutes instead of days. Get feedback on the day.

You stop debating interpretations and start iterating on the product itself.
