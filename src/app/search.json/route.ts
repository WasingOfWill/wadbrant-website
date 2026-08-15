import { formatDate, getAllPosts, stripHtml, decodeEntities, truncate } from '@/lib/posts';

export const dynamic = 'force-static';

/** Static search index consumed by the top bar search box. */
export async function GET() {
  const posts = await getAllPosts();

  const index = posts.map((post) => {
    const text = decodeEntities(stripHtml(post.content)).replace(/\s+/g, ' ').trim();
    return {
      title: post.title,
      url: post.url,
      categories: post.categories,
      tags: post.tags,
      /** "Nov 2025" — enough context without cluttering the result. */
      date: formatDate(post.date, { month: 'short', year: 'numeric' }),
      snippet: truncate(text, 180),
      content: text,
    };
  });

  return Response.json(index);
}
