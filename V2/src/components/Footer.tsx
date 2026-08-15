import { site } from '@/lib/site';

export default function Footer() {
  return (
    <footer
      aria-label="Site Info"
      className="d-flex flex-column justify-content-center text-muted flex-lg-row justify-content-lg-between align-items-lg-center pb-lg-3"
    >
      <p>
        ©
        <time>{new Date().getFullYear()}</time>{' '}
        <a href={site.author.github}>{site.author.name}</a>.{' '}
        <span title={site.copyright.verbose}>{site.copyright.brief}</span>
      </p>
    </footer>
  );
}
