# Tests

Everything here runs unattended. `npm run verify` builds the site and then runs
all of it; `npm test` runs it against a build you already have.

```bash
npm run verify
```

Suites, in the order they run:

| Suite | What it proves | Needs a browser |
| --- | --- | --- |
| `style.mjs` | No bold and no em dashes anywhere the project authors text | no |
| `content.mjs` | Front matter is valid, slugs are unique, every referenced image and internal link exists | no |
| `build-output.mjs` | Every route answers, feed and sitemap are real, the search index matches the posts, no page links to a 404, a missing page really 404s | no |
| `functional.mjs` | Interface checks: dark mode, search, table of contents, related posts, lightbox, code block padding, back to top, the homepage map, mobile sidebar and mask | yes |

Puppeteer is installed on demand the first time a browser suite runs. It is
deliberately not a dependency, because it downloads a browser and would slow
every deploy.

## snapshot.mjs

Not part of `verify`. Use it when a refactor should change nothing visible:

```bash
node tests/snapshot.mjs baseline    # before the change
node tests/snapshot.mjs after       # after it
node tests/snapshot.mjs --diff baseline after
```

Differences above 0.02% are written to `.snapshots/diff/` so you can look at
what moved.

## Adding a check

New behaviour needs a check in the same commit. Put it in the suite that
matches: content rules in `content.mjs`, anything reachable over HTTP in
`build-output.mjs`, anything needing clicks in `functional.mjs`. Each suite
exits non-zero on failure and prints one line per problem.
