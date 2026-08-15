'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation, site } from '@/lib/site';
import ModeToggle from './ModeToggle';

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside aria-label="Sidebar" id="sidebar" className="d-flex flex-column align-items-end">
      <header className="profile-wrapper">
        <Link href="/" id="avatar" className="rounded-circle" aria-label="Home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.avatarSmall}
            srcSet={`${site.avatarSmall} 1x, ${site.avatar} 2x`}
            width={112}
            height={112}
            alt="Will Wadbrant"
            fetchPriority="high"
          />
        </Link>

        <h1 className="site-title">
          <Link href="/">{site.title}</Link>
        </h1>
        <p className="site-subtitle fst-italic mb-0">{site.tagline}</p>
      </header>

      <nav className="flex-column flex-grow-1 w-100 ps-0">
        <ul className="nav">
          {navigation.map((item) => (
            <li className="nav-item" key={item.href}>
              <Link
                href={item.href}
                className={`nav-link${isActive(pathname, item.href) ? ' active' : ''}`}
                aria-current={isActive(pathname, item.href) ? 'page' : undefined}
              >
                <i className={`fa-fw ${item.icon}`} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-bottom d-flex flex-wrap align-items-center w-100">
        <ModeToggle />
      </div>
    </aside>
  );
}
