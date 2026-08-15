import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const LIVE = 'https://wadbrant.com';
const LOCAL = process.env.LOCAL ?? 'http://localhost:4000';

const PAGES = process.env.PAGES
  ? process.env.PAGES.split(',')
  : ['/', '/posts/why-indie-games-fail/', '/tags/', '/categories/', '/archives/', '/about/', '/cv/'];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000, deviceScaleFactor: 1 },
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
];

const outDir = path.join(process.cwd(), 'out');
fs.mkdirSync(outDir, { recursive: true });

const slug = (p) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '_'));

async function shoot(browser, base, route, viewport, label) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(base + route, { waitUntil: 'networkidle0', timeout: 60000 });
  // Neutralise animations and lazy loading so the two captures are comparable.
  await page.evaluate(async () => {
    document.querySelectorAll('img').forEach((img) => {
      img.loading = 'eager';
      img.removeAttribute('loading');
    });
    document.querySelectorAll('.shimmer').forEach((el) => el.classList.remove('shimmer'));
    await new Promise((resolve) => setTimeout(resolve, 800));
    window.scrollTo(0, document.body.scrollHeight);
    await new Promise((resolve) => setTimeout(resolve, 600));
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 400));
  });
  const file = path.join(outDir, `${label}-${viewport.name}-${slug(route)}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
  return file;
}

function diff(a, b, outFile) {
  const imgA = PNG.sync.read(fs.readFileSync(a));
  const imgB = PNG.sync.read(fs.readFileSync(b));
  const width = Math.min(imgA.width, imgB.width);
  const height = Math.min(imgA.height, imgB.height);

  const crop = (img) => {
    const out = new PNG({ width, height });
    PNG.bitblt(img, out, 0, 0, width, height, 0, 0);
    return out;
  };
  const ca = crop(imgA);
  const cb = crop(imgB);
  const out = new PNG({ width, height });
  const mismatched = pixelmatch(ca.data, cb.data, out.data, width, height, { threshold: 0.12 });
  fs.writeFileSync(outFile, PNG.sync.write(out));
  return {
    mismatched,
    ratio: mismatched / (width * height),
    sizeA: `${imgA.width}x${imgA.height}`,
    sizeB: `${imgB.width}x${imgB.height}`,
  };
}

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const rows = [];

for (const viewport of VIEWPORTS) {
  for (const target of PAGES) {
    try {
      const liveShot = await shoot(browser, LIVE, target, viewport, 'live');
      const localShot = await shoot(browser, LOCAL, target, viewport, 'v2');
      const result = diff(
        liveShot,
        localShot,
        path.join(outDir, `diff-${viewport.name}-${slug(target)}.png`)
      );
      rows.push({ viewport: viewport.name, page: target, ...result });
    } catch (error) {
      rows.push({ viewport: viewport.name, page: target, error: String(error).slice(0, 120) });
    }
  }
}

await browser.close();

for (const row of rows) {
  if (row.error) {
    console.log(`${row.viewport.padEnd(8)} ${row.page.padEnd(32)} ERROR ${row.error}`);
  } else {
    console.log(
      `${row.viewport.padEnd(8)} ${row.page.padEnd(32)} live=${row.sizeA.padEnd(10)} v2=${row.sizeB.padEnd(10)} diff=${(row.ratio * 100).toFixed(2)}%`
    );
  }
}
