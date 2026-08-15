import { getAllPosts } from '@/lib/posts';
import { site } from '@/lib/site';

export const dynamic = 'force-static';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = await getAllPosts();
  const updated = posts[0]?.date ?? new Date();

  const entries = posts
    .map(
      (post) => `  <entry>
    <title>${escapeXml(post.title)}</title>
    <link href="${site.url}${post.url}"/>
    <id>${site.url}${post.url}</id>
    <published>${post.date.toISOString()}</published>
    <updated>${post.lastModified.toISOString()}</updated>
    <author><name>${escapeXml(site.author.name)}</name></author>
    <summary type="text">${escapeXml(post.excerpt)}</summary>
${post.categories.map((category) => `    <category term="${escapeXml(category)}"/>`).join('\n')}
  </entry>`
    )
    .join('\n');

  const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(site.title)}</title>
  <subtitle>${escapeXml(site.description)}</subtitle>
  <link href="${site.url}/feed.xml" rel="self"/>
  <link href="${site.url}/"/>
  <id>${site.url}/</id>
  <updated>${updated.toISOString()}</updated>
  <author><name>${escapeXml(site.author.name)}</name><email>${site.author.email}</email></author>
${entries}
</feed>
`;

  return new Response(feed, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
}
