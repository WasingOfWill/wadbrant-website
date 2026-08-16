import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import smartypants from 'remark-smartypants';

/** kramdown's typographic defaults: `--` is an en dash, `---` an em dash. */
const SMARTYPANTS_OPTIONS = { dashes: 'oldschool' } as const;
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import rehypePrettyCode from 'rehype-pretty-code';
import { visit } from 'unist-util-visit';
import type { Element, Root, ElementContent } from 'hast';

/**
 * Accepts asset paths written without a leading slash
 * (`assets/posts/x/01.png` becomes `/assets/posts/x/01.png`).
 */
function normalizeAssetPath(src: string): string {
  if (/^(https?:)?\/\//.test(src) || src.startsWith('/') || src.startsWith('data:')) {
    return src;
  }
  return `/${src.replace(/^\.\//, '')}`;
}

/**
 * Section headings carry an anchor link:
 *   <h2 id="x"><span class="me-2">Text</span><a href="#x" class="anchor text-muted">…</a></h2>
 */
function rehypeHeadingAnchors() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (!['h2', 'h3', 'h4'].includes(node.tagName)) return;
      const id = node.properties?.id;
      const firstChild = node.children[0] as Element | undefined;
      const alreadyWrapped = String(firstChild?.properties?.className ?? '').includes('me-2');
      if (!id || alreadyWrapped) return;

      const label: Element = {
        type: 'element',
        tagName: 'span',
        properties: { className: ['me-2'] },
        children: node.children as ElementContent[],
      };
      const anchor: Element = {
        type: 'element',
        tagName: 'a',
        properties: { href: `#${id}`, className: ['anchor', 'text-muted'] },
        children: [
          {
            type: 'element',
            tagName: 'i',
            properties: { className: ['fas', 'fa-hashtag'] },
            children: [],
          },
        ],
      };
      node.children = [label, anchor];
    });
  };
}

/**
 * Content images open in a lightbox, sit on a shimmer placeholder while
 * they load, and are lazy-loaded.
 */
function rehypeImages() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'img' || !parent || index === undefined) return;
      if ((parent as Element).tagName === 'a') return;

      const src = normalizeAssetPath(String(node.properties?.src ?? ''));
      node.properties = { ...node.properties, src, loading: 'lazy' };

      const wrapper: Element = {
        type: 'element',
        tagName: 'a',
        properties: { href: src, className: ['popup', 'img-link', 'shimmer'] },
        children: [node],
      };
      (parent as Element).children[index] = wrapper;
    });
  };
}

/** Wide tables scroll horizontally instead of breaking the layout. */
function rehypeTableWrapper() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      if ((parent as Element).properties?.className?.toString().includes('table-wrapper')) return;

      (parent as Element).children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-wrapper'] },
        children: [node],
      };
    });
  };
}

/**
 * Attaches classes to the block above, e.g.
 *   > Some note
 *   {: .prompt-tip }
 * The trailing paragraph is consumed and its classes applied to the block above.
 */
const KRAMDOWN_ATTR = /^\{:\s*([^}]+)\s*\}$/;

function remarkKramdownAttributes() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (!node.children || !Array.isArray(node.children)) return;
      for (let i = node.children.length - 1; i >= 0; i -= 1) {
        const child = node.children[i];
        const text =
          child?.type === 'paragraph' &&
          child.children?.length === 1 &&
          child.children[0].type === 'text'
            ? child.children[0].value.trim()
            : null;
        const match = text ? KRAMDOWN_ATTR.exec(text) : null;
        if (!match || i === 0) continue;

        const target = node.children[i - 1];
        const classes = match[1]
          .split(/\s+/)
          .filter((token) => token.startsWith('.'))
          .map((token) => token.slice(1));
        if (classes.length) {
          target.data = target.data ?? {};
          target.data.hProperties = { ...(target.data.hProperties ?? {}), className: classes };
        }
        node.children.splice(i, 1);
      }
    });
  };
}

/** Inline `code`{: .filepath } style attributes attached to inline nodes. */
function remarkInlineAttributes() {
  return (tree: any) => {
    visit(tree, 'text', (node: any, index, parent: any) => {
      if (!parent || index === undefined || index === 0) return;
      const match = /^\{:\s*([^}]+)\s*\}/.exec(node.value);
      if (!match) return;
      const previous = parent.children[index - 1];
      if (!previous || (previous.type !== 'inlineCode' && previous.type !== 'link')) return;

      const classes = match[1]
        .split(/\s+/)
        .filter((token) => token.startsWith('.'))
        .map((token) => token.slice(1));
      previous.data = previous.data ?? {};
      previous.data.hProperties = {
        ...(previous.data.hProperties ?? {}),
        className: classes,
      };
      node.value = node.value.slice(match[0].length);
    });
  };
}

/** Code block chrome: `.language-x > .highlight > pre`. */
function rehypeCodeChrome() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;
      const parentClasses = String((parent as Element).properties?.className ?? '');
      if (parentClasses.includes('highlight')) return;

      const code = node.children.find(
        (child): child is Element => child.type === 'element' && child.tagName === 'code'
      );
      const language =
        String(code?.properties?.['data-language'] ?? node.properties?.['data-language'] ?? 'plaintext');

      (parent as Element).children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: [`language-${language}`, 'highlighter-rouge'] },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['highlight'] },
            children: [node],
          },
        ],
      };
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // kramdown applied typographic quotes/dashes by default; keep that look.
  .use(smartypants, SMARTYPANTS_OPTIONS)
  .use(remarkKramdownAttributes)
  .use(remarkInlineAttributes)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypePrettyCode, {
    theme: { light: 'github-light', dark: 'github-dark-dimmed' },
    keepBackground: false,
    defaultLang: 'plaintext',
  })
  .use(rehypeCodeChrome)
  .use(rehypeSlug)
  .use(rehypeHeadingAnchors)
  .use(rehypeImages)
  .use(rehypeTableWrapper)
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}

/** Minimal pipeline used for excerpts: no chrome, no anchors. */
const excerptProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(smartypants, SMARTYPANTS_OPTIONS)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify, { allowDangerousHtml: true });

export async function renderExcerptHtml(markdown: string): Promise<string> {
  return String(await excerptProcessor.process(markdown));
}
