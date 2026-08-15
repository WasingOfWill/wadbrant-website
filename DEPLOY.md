# Deploying to Vercel

The site is a static Next.js app at the root of the
`WasingOfWill/wadbrant-website` repository. Vercel builds it on every push to
`main`, and gives every branch and pull request its own preview URL.

## 1. Create the project (once)

1. Go to <https://vercel.com/new> and sign in with GitHub.
2. Pick **wadbrant-website** from the repository list. If it is not listed,
   click *Adjust GitHub App Permissions* and grant access to it.
3. Leave **Root Directory** as the repository root. Everything else can stay
   on its defaults — the framework is detected as Next.js and the build command
   is `next build`.
4. Click **Deploy**. The first build takes about a minute.

You now have a URL such as `wadbrant-website.vercel.app`. Check it against the
old site before touching DNS.

## 2. Point wadbrant.com at it

Once the preview URL looks right:

1. In the Vercel project: **Settings → Domains → Add** → `wadbrant.com`.
   Add `www.wadbrant.com` as well and let Vercel redirect it to the apex.
2. Vercel shows the DNS records to create at whichever registrar or DNS host
   currently serves wadbrant.com (the site is behind Cloudflare today, so the
   records live there):

   | Type | Name | Value |
   | --- | --- | --- |
   | `A` | `@` | `76.76.21.21` |
   | `CNAME` | `www` | `cname.vercel-dns.com` |

   Vercel is the source of truth for these values — use whatever the dashboard
   shows you at the time.
3. If the DNS is on Cloudflare, set those records to **DNS only** (grey cloud)
   rather than proxied, so Vercel can issue the TLS certificate.
4. Delete the old GitHub Pages records for the apex once Vercel reports the
   domain as valid. GitHub Pages will keep serving the old build until you do.
5. The repository still contains a `CNAME` file for GitHub Pages. It does
   nothing on Vercel and can be deleted when the old site is retired.

Propagation is usually minutes. Vercel provisions the certificate automatically.

## 3. Retire GitHub Pages

The workflow that built the Jekyll site (`.github/workflows/pages-deploy.yml`)
is already deleted, so nothing rebuilds it. Two things still need a click in the
GitHub UI, because GitHub keeps serving the last build and keeps holding the
custom domain until you tell it not to:

1. **Stop the site being served** — repository → **Settings → Pages** → under
   *Build and deployment*, set **Source** to **None**. (If the dropdown has no
   *None* option, switch it to *Deploy from a branch* and pick a branch with no
   content, e.g. `jekyll-legacy` with folder `/docs`.)
2. **Release the domain** — on the same page, clear the **Custom domain** field
   (`wadbrant.com`) and save. Vercel cannot issue a certificate for the domain
   while GitHub still claims it.
3. Optional: **Actions → Deploy Jekyll site to Pages** in the left sidebar →
   the `…` menu → **Disable workflow**, if the old runs still show up. Deleting
   the file is enough to stop new runs; this only hides the history.
4. Once the domain is live on Vercel, delete the `CNAME` file from the
   repository root — it exists only for GitHub Pages.

Do step 1 and 2 right before you add the domain in Vercel, so there is no
window where neither service answers.

## 4. Everyday publishing

```bash
git add content/posts/2026-01-01-my-post.md
git commit -m "post: my post"
git push
```

Vercel builds and deploys. A pull request instead gets a preview URL, which is
the safe way to review a draft with someone before it goes live.

## Settings worth knowing

- **Environment variables** — none are required. `NEXT_PUBLIC_SITE_URL` can be
  set to override the canonical origin used in metadata, sitemap and feed.
- **Analytics** — Google Analytics (`G-HVDB517FPM`) is loaded in production
  only. Vercel's own Web Analytics can be enabled from the dashboard if you
  want it, no code change needed.

## Rolling back

Every deployment is kept. Open the project's **Deployments** tab, find the last
good one and use **Promote to Production**. The previous Jekyll site also still
exists on the `jekyll-legacy` branch.
