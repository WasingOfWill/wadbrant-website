'use client';

import { useEffect, useState } from 'react';

export type Heading = { id: string; text: string; level: number };

type TreeNode = Heading & { children: Heading[] };

function toTree(headings: Heading[]): TreeNode[] {
  const tree: TreeNode[] = [];
  for (const heading of headings) {
    if (heading.level <= 2 || tree.length === 0) tree.push({ ...heading, children: [] });
    else tree[tree.length - 1].children.push(heading);
  }
  return tree;
}

/** Highlights the heading currently closest to the top of the viewport. */
function useActiveHeading(headings: Heading[]): string | null {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null);

  useEffect(() => {
    const targets = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element));
    if (targets.length === 0) return;

    const onScroll = () => {
      let current = targets[0].id;
      for (const target of targets) {
        if (target.getBoundingClientRect().top <= 80) current = target.id;
      }
      setActive(current);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [headings]);

  return active;
}

export default function Toc({ headings }: { headings: Heading[] }) {
  const active = useActiveHeading(headings);
  const tree = toTree(headings);

  const link = (heading: Heading) => (
    <a
      href={`#${heading.id}`}
      className={`toc-link node-name--H${heading.level}${
        active === heading.id ? ' is-active-link' : ''
      }`}
    >
      {heading.text}
    </a>
  );

  return (
    <section id="toc-wrapper" className="ps-0 pe-4">
      <h2 className="panel-heading ps-3 pt-2 mb-2">Contents</h2>
      <nav id="toc">
        <ul className="toc-list">
          {tree.map((node) => (
            <li className="toc-list-item" key={node.id}>
              {link(node)}
              {node.children.length > 0 && (
                <ul className="toc-list">
                  {node.children.map((child) => (
                    <li className="toc-list-item" key={child.id}>
                      {link(child)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
