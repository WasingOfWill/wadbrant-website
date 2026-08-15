import puppeteer from 'puppeteer';

const BASE = process.env.LOCAL ?? 'http://localhost:4000';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

/* ---------------------------------------------------------------- desktop */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });

  // Dark mode toggle
  await page.click('.mode-toggle');
  await new Promise((r) => setTimeout(r, 300));
  const mode = await page.evaluate(() => ({
    attr: document.documentElement.getAttribute('data-mode'),
    bg: getComputedStyle(document.body).backgroundColor,
    stored: localStorage.getItem('mode'),
  }));
  check('mode toggle sets data-mode', Boolean(mode.attr), JSON.stringify(mode));
  const expectedBg = mode.attr === 'dark' ? 'rgb(27, 27, 30)' : 'rgb(255, 255, 255)';
  check('mode toggle repaints body to match the mode', mode.bg === expectedBg, `${mode.attr} -> ${mode.bg}`);

  await page.click('.mode-toggle');
  await new Promise((r) => setTimeout(r, 200));
  const back = await page.evaluate(() => document.documentElement.getAttribute('data-mode'));
  check('mode toggle switches back', back !== mode.attr, `${mode.attr} -> ${back}`);

  // Search
  await page.click('#search-input');
  await page.type('#search-input', 'genre');
  await new Promise((r) => setTimeout(r, 700));
  const search = await page.evaluate(() => ({
    flag: document.documentElement.getAttribute('data-search'),
    results: document.querySelectorAll('#search-results article').length,
    mainVisible: getComputedStyle(document.querySelector('#post-list').closest('.row')).display,
  }));
  check('search shows results', search.results > 0, `${search.results} hits`);
  check('search hides main content', search.mainVisible === 'none', search.mainVisible);

  // The cancel button is only visible on small screens; clear via the keyboard.
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await new Promise((r) => setTimeout(r, 300));
  const cleared = await page.evaluate(() => document.documentElement.getAttribute('data-search'));
  check('search cancel restores page', cleared === null, String(cleared));

  // Client-side navigation to a post
  await page.click('#post-list .card-wrapper a');
  await page.waitForSelector('#toc-wrapper', { timeout: 10000 });
  const post = await page.evaluate(() => ({
    toc: document.querySelectorAll('#toc .toc-link').length,
    related: document.querySelectorAll('#related-posts article').length,
    nav: document.querySelectorAll('.post-navigation a').length,
    tags: document.querySelectorAll('.post-tags .post-tag').length,
  }));
  check('post page has a table of contents', post.toc > 0, `${post.toc} entries`);
  check('post page has related posts', post.related > 0, `${post.related}`);
  check('post page has prev/next', post.nav > 0, `${post.nav}`);
  check('post page has tags', post.tags > 0, `${post.tags}`);

  // Image lightbox
  await page.click('.content a.popup');
  await new Promise((r) => setTimeout(r, 300));
  const popup = await page.evaluate(() => Boolean(document.querySelector('#image-popup img')));
  check('image lightbox opens', popup);
  await page.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 200));
  const closed = await page.evaluate(() => !document.querySelector('#image-popup'));
  check('image lightbox closes on Escape', closed);

  // Back to top
  await page.evaluate(() => window.scrollTo(0, 1200));
  await new Promise((r) => setTimeout(r, 400));
  const backToTop = await page.evaluate(
    () => getComputedStyle(document.querySelector('#back-to-top')).display
  );
  check('back-to-top appears on scroll', backToTop !== 'none', backToTop);

  await page.close();
}

/* ----------------------------------------------------------------- mobile */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });

  const hidden = await page.evaluate(() => {
    const rect = document.querySelector('#sidebar').getBoundingClientRect();
    return rect.right <= 1;
  });
  check('sidebar is off-canvas on mobile', hidden);

  await page.click('#sidebar-trigger');
  await new Promise((r) => setTimeout(r, 600));
  const opened = await page.evaluate(() => {
    const rect = document.querySelector('#sidebar').getBoundingClientRect();
    return {
      visible: rect.right > 100,
      mask: getComputedStyle(document.querySelector('#mask')).display,
      toggle: Boolean(document.querySelector('#sidebar .mode-toggle')),
    };
  });
  check('hamburger opens the sidebar', opened.visible, JSON.stringify(opened));
  check('mask covers the page while open', opened.mask === 'block', opened.mask);
  check('mode toggle reachable on mobile', opened.toggle);

  await page.mouse.click(300, 500);
  await new Promise((r) => setTimeout(r, 600));
  const reclosed = await page.evaluate(
    () => document.querySelector('#sidebar').getBoundingClientRect().right <= 1
  );
  check('tapping the mask closes the sidebar', reclosed);

  await page.close();
}

await browser.close();

let failed = 0;
for (const result of results) {
  if (!result.ok) failed += 1;
  console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? `  — ${result.detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
