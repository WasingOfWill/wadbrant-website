# Deploying

The site is a static Next.js app at the root of this repository. Vercel builds
it on every push to `main`, and gives every branch and pull request its own
preview URL.

Day to day there is nothing to do here: commit, push, done. This file is for
the settings behind that.

## Vercel project

- Repository: `WasingOfWill/wadbrant-website`, branch `main`
- Root directory: the repository root
- Framework: Next.js, detected automatically, build command `next build`
- Environment variables: none required. `NEXT_PUBLIC_SITE_URL` overrides the
  canonical origin used in metadata, sitemap and feed.

## Domain

`wadbrant.com` and `www.wadbrant.com` both point at Vercel. DNS is served by
Cloudflare, with the registrar at Namecheap only delegating the nameservers.

Two things matter if the records are ever touched:

- Records for Vercel must be `DNS only` (grey cloud). Proxying them breaks
  certificate issuance and Vercel reports `Proxy Detected`.
- The apex is the primary domain. `www` redirects to it with a 308, because
  every canonical URL, the sitemap and the feed use the apex.

Current shape, both grey:

| Type | Name | Target |
| --- | --- | --- |
| CNAME | `@` | the target Vercel shows for this project |
| CNAME | `www` | `wadbrant.com` |

Vercel is the source of truth for the target value; read it from the domain
settings rather than copying it from here.

## Verifying a deploy

```bash
LOCAL=https://wadbrant.com node tests/functional.mjs
```

Runs the interface suite against production. Useful right after a deploy that
touched anything interactive.

## Rolling back

Every deployment is kept. Open the project's Deployments tab, find the last
good one, and use Promote to Production.
