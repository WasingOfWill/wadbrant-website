import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import '@/styles/globals.css';
import Sidebar from '@/components/Sidebar';
import Mask from '@/components/Mask';
import SearchProvider from '@/components/SearchProvider';
import { site } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s | ${site.title}`,
  },
  description: site.description,
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': `${site.url}/feed.xml` },
  },
  openGraph: {
    type: 'website',
    siteName: site.title,
    title: site.title,
    description: site.description,
    locale: site.lang,
    images: [site.ogImage],
  },
  twitter: {
    card: 'summary',
    title: site.title,
    site: site.author.twitterHandle,
  },
  icons: {
    icon: [
      { url: '/assets/favicons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/favicons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/assets/favicons/apple-touch-icon.png',
    shortcut: '/assets/favicons/favicon.ico',
  },
  manifest: '/assets/favicons/site.webmanifest',
  appleWebApp: { capable: true, title: site.title, statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f7f7' },
    { media: '(prefers-color-scheme: dark)', color: '#1b1b1e' },
  ],
};

/** Applies the stored colour mode before first paint to avoid a flash. */
const MODE_SCRIPT = `(function(){try{var m=localStorage.getItem('mode');if(m){document.documentElement.setAttribute('data-mode',m);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={site.lang} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: MODE_SCRIPT }} />
        {/* The two faces used above the fold; the rest load on demand. */}
        <link
          rel="preload"
          href="/assets/fonts/source-sans-pro-400-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/assets/fonts/lato-400-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <SearchProvider>
          <Sidebar />
          {children}
          <Mask />
        </SearchProvider>

        {site.googleAnalyticsId && process.env.NODE_ENV === 'production' && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${site.googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="ga" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${site.googleAnalyticsId}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
