/**
 * Screenshots every page of the local site into a folder, and diffs against a
 * previous run. Used to prove that a refactor changed no pixels.
 *
 *   node tests/snapshot.mjs baseline     # capture
 *   node tests/snapshot.mjs after        # capture again
 *   node tests/snapshot.mjs --diff baseline after
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const BASE = process.env.LOCAL ?? 'http://localhost:4000';
const OUT = path.join(process.cwd(), '.snapshots');

const PAGES = [
  '/',
  '/posts/why-indie-games-fail/',
  '/posts/deep-into-mystery-games/',
  '/tags/',
  '/tags/product-management/',
  '/categories/',
  '/categories/indie/',
  '/archives/',
  '/about/',
  '/cv/',
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844, isMobile: true, hasTouch: true },
];

const slug = (p) => (p === '/' ? 'home' : p.replace(/^\/|\/$/g, '').replace(/\//g, '_'));

async function capture(label) {
  const dir = path.join(OUT, label);
  fs.mkdirSync(dir, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

  for (const viewport of VIEWPORTS) {
    for (const route of PAGES) {
      const page = await browser.newPage();
      await page.setViewport(viewport);
      await page.goto(BASE + route, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.evaluate(async () => {
        // Smooth scrolling would leave fixed elements mid-flight in the capture.
        document.documentElement.style.scrollBehavior = 'auto';
        document.querySelectorAll('.shimmer').forEach((el) => el.classList.remove('shimmer'));
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 700));
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 400));
      });
      await page.screenshot({
        path: path.join(dir, `${viewport.name}-${slug(route)}.png`),
        fullPage: true,
      });
      await page.close();
    }
  }

  await browser.close();
  console.log(`captured ${PAGES.length * VIEWPORTS.length} screenshots into .snapshots/${label}`);
}

function diff(a, b) {
  let worst = 0;
  for (const file of fs.readdirSync(path.join(OUT, a))) {
    const left = path.join(OUT, a, file);
    const right = path.join(OUT, b, file);
    if (!fs.existsSync(right)) {
      console.log(`${file.padEnd(34)} MISSING in ${b}`);
      continue;
    }
    const imgA = PNG.sync.read(fs.readFileSync(left));
    const imgB = PNG.sync.read(fs.readFileSync(right));
    const width = Math.min(imgA.width, imgB.width);
    const height = Math.min(imgA.height, imgB.height);
    const crop = (img) => {
      const out = new PNG({ width, height });
      PNG.bitblt(img, out, 0, 0, width, height, 0, 0);
      return out;
    };
    const out = new PNG({ width, height });
    const mismatched = pixelmatch(crop(imgA).data, crop(imgB).data, out.data, width, height, {
      threshold: 0.1,
    });
    const ratio = (mismatched / (width * height)) * 100;
    worst = Math.max(worst, ratio);
    const size = imgA.height === imgB.height ? '' : `  height ${imgA.height} -> ${imgB.height}`;
    console.log(`${file.padEnd(34)} ${ratio.toFixed(2)}%${size}`);
    if (ratio > 0.02) {
      fs.mkdirSync(path.join(OUT, 'diff'), { recursive: true });
      fs.writeFileSync(path.join(OUT, 'diff', file), PNG.sync.write(out));
    }
  }
  console.log(`\nworst: ${worst.toFixed(2)}%`);
}

const args = process.argv.slice(2);
if (args[0] === '--diff') diff(args[1], args[2]);
else await capture(args[0] ?? 'baseline');
