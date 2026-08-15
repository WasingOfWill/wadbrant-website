# Working on wadbrant.com

## Before you touch anything

Read `reference.md`. It is the map of this project: stack, layout, content
model, commands. If what you are about to do contradicts it, you have
misunderstood something; re-read it rather than guessing.

## What this site is trying to be

Five things, in priority order. When they conflict, the higher one wins.

1. Fast. No layout shift, no jank, no blocking work on the main thread. Static
   output, images sized for their box, fonts self-hosted, no third-party
   scripts. A feature that costs a visible frame has to earn it.
2. Minimal. Fewer elements, fewer colours, fewer dependencies, fewer clicks.
   Delete before you add. A change that removes code and keeps the behaviour is
   a good change.
3. Quietly polished. Movement is a whisper: 150 to 250ms, ease-out, small
   distances, colour shifts over motion. Nothing bounces. Nothing announces
   itself. Always honour `prefers-reduced-motion`.
4. Tech-nerdy. Modern and precise, like good developer tooling: sharp type,
   honest spacing, monospace where it means something, no decoration that is
   not also information.
5. Built like a world. Take cues from storytelling, worldbuilding and games:
   pacing, progressive disclosure, a sense of place, small rewards for
   exploring. Reading here should feel like moving through somewhere, not
   scrolling a document.

## Writing rules, absolute

Never use bold. Not in interface copy, not in documentation, not in comments,
not in replies to the user. Emphasis comes from structure and word choice.

Never use em dashes. Use a colon, a comma, a full stop, or parentheses.

Never let the work read as generic AI output. No filler openers, no "in today's
fast-paced world", no emoji headings, no gradient-and-rounded-corner template
look, no lists of three adjectives. Be specific, be short, sound like a person
who knows the subject.

`npm run verify` enforces the first two mechanically across everything the
project authors. The third is on you, and on the reviewer.

## Rules

Verify everything you build. A change is not done when the code is written; it
is done when something automated proves it works. Run `npm run verify`. If you
added behaviour, add the check that covers it in `tests/`. Never report success
on the strength of reading the diff.

Say what you could not test. If a change cannot be verified automatically, such
as visual taste, copy, or anything needing a real device, end your message with
a short `Needs your eyes:` list. One line each. No hedging paragraphs.

Prefer automation over instructions. Every time you are about to tell the user
to do something by hand, ask whether a script, a hook or a CI step could do it
instead. Manual steps are a last resort and belong in `DEPLOY.md`.

Keep `reference.md` true. Update it in the same commit when you change how the
site works: routes, content model, derived data, styling layers, commands,
deployment. Do not update it for cosmetic tweaks, copy edits or refactors that
change nothing observable. That file has to stay short enough to read in a
minute.

Own the code. There is no upstream theme and nothing to match. Design decisions
are ours; make them on merit and on current web best practice.

Small, legible commits. One concern per commit, with a message that says what
changed and why.

## House style

- TypeScript, strict. No `any` that could be a real type.
- Components are server components unless they need state or events.
- Comments explain why, never what. Delete comments that restate the code.
- CSS: colours come from the tokens in `theme.css`. No hard-coded colours in
  components, no `!important` unless overriding something outside our control.
- Content is Markdown in `content/`. Never hard-code an article into a
  component.
- No new dependency without a reason that survives being asked twice.

## Definition of done

- [ ] `npm run verify` passes
- [ ] New behaviour has an automated check
- [ ] No bold, no em dashes, nothing that reads as generic AI output
- [ ] `reference.md` updated if the site's behaviour changed
- [ ] Anything unverifiable flagged as `Needs your eyes:`
