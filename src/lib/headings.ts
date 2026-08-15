import { decodeEntities, stripHtml } from './posts';
import type { Heading } from '@/components/Toc';

const HEADING = /<h([2-4])\s[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;

/** Pulls the table-of-contents entries out of rendered post HTML. */
export function extractHeadings(html: string): Heading[] {
  const headings: Heading[] = [];
  for (const match of html.matchAll(HEADING)) {
    const inner = match[3].replace(/<a[^>]*class="[^"]*anchor[^"]*"[\s\S]*?<\/a>/g, '');
    headings.push({
      level: Number(match[1]),
      id: match[2],
      text: decodeEntities(stripHtml(inner)).trim(),
    });
  }
  return headings;
}
