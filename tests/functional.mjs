import puppeteer from 'puppeteer';

const BASE = process.env.LOCAL ?? 'http://localhost:4000';
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

/* ---------------------------------------------------------------- desktop */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(`${BASE}/articles/`, { waitUntil: 'networkidle0' });

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
  await page.$eval('#post-list .card-wrapper a', (el) => el.click());
  await page.waitForSelector('#toc-wrapper', { timeout: 10000 });
  const post = await page.evaluate(() => ({
    toc: document.querySelectorAll('#toc .toc-link').length,
    related: document.querySelectorAll('#related-posts .related-item').length,
    nav: document.querySelectorAll('.post-navigation a').length,
    tags: document.querySelectorAll('.post-tags .post-tag').length,
  }));
  check('post page has a table of contents', post.toc > 0, `${post.toc} entries`);
  check('post page has related posts', post.related === 3, `${post.related}`);
  check('post page has prev/next', post.nav > 0, `${post.nav}`);
  check('post page has tags', post.tags > 0, `${post.tags}`);

  const crumbs = await page.evaluate(() => ({
    labels: [...document.querySelectorAll('#breadcrumb span')].map((el) => el.textContent.trim()),
    first: document.querySelector('#breadcrumb a')?.getAttribute('href'),
    links: [...document.querySelectorAll('#breadcrumb a')].map((el) => el.getAttribute('href')),
  }));
  check(
    'post breadcrumb starts at Articles, not Home',
    crumbs.labels[0] === 'Articles' && crumbs.first === '/articles/',
    JSON.stringify(crumbs)
  );
  check(
    'post breadcrumb carries a linked category before the title',
    crumbs.labels.length >= 3 && crumbs.links.some((href) => href.startsWith('/categories/')),
    JSON.stringify(crumbs)
  );

  // Image lightbox - click via the DOM so an off-screen image still works.
  await page.$eval('.content a.popup', (el) => el.click());
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
  await page.goto(`${BASE}/articles/`, { waitUntil: 'networkidle0' });

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

/* ----------------------------------------------------- homepage map moves */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));

  const tap = async (selector) => {
    const box = await (await page.$(selector)).boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.up();
    await new Promise((r) => setTimeout(r, 500));
  };

  const start = await page.evaluate(() => ({
    heading: document.querySelector('#hexmap-panel h2').textContent,
    featured: document.querySelectorAll('.hex[data-hub="home"][data-kind="article"][data-active]')
      .length,
    badges: document.querySelectorAll('.hex-badge').length,
    distant: [...document.querySelectorAll('.hex[data-kind="article"][data-active]')].filter(
      (tile) => tile.dataset.hub !== 'home'
    ).length,
    gateways: document.querySelectorAll('.hex[data-kind="gateway"]').length,
    wild: document.querySelectorAll('.hex[data-kind="wild"]').length,
  }));
  check('map opens at camp', start.heading === 'Wadbrant', start.heading);
  check('recent work sits around camp', start.featured >= 8, `${start.featured} tiles`);
  check('each cluster is named once', start.badges === 4, `${start.badges} badges`);
  check('distant entries stay illegible', start.distant === 0, `${start.distant} lit`);
  check('every region has a road out', start.gateways === 6, `${start.gateways}`);
  check('the world has empty ground', start.wild > 40, `${start.wild} tiles`);

  // A city is a long way off. Nothing in it may be reached from home.
  await tap('.hex[data-hub="ongoing"][data-kind="article"]');
  const ignored = await page.evaluate(
    () => document.querySelector('#hexmap-panel h2').textContent
  );
  check('a distant entry cannot be opened from camp', ignored === 'Wadbrant', ignored);

  await tap('.hex[data-id="gateway-ongoing"]');
  const entered = await page.evaluate(() => ({
    heading: document.querySelector('#hexmap-panel h2').textContent,
    place: document.getElementById('hexmap').dataset.place,
    lit: document.querySelectorAll('.hex[data-hub="ongoing"][data-kind="article"][data-active]')
      .length,
    holds: Number(document.querySelector('.hex[data-id="city-ongoing"]').dataset.holds),
    others: document.querySelectorAll('.hex[data-hub="product"][data-active]').length,
    reads: document.querySelectorAll('#hexmap-panel .hexmap-list a').length,
    cta: document.querySelector('#hexmap-panel .hexmap-go')?.getAttribute('href'),
    back: document.querySelectorAll('.hex[data-kind="return"][data-active]').length,
  }));
  check('travelling arrives in the city', entered.place === 'ongoing', String(entered.place));
  check('the city names its region', entered.heading === 'Ongoing', entered.heading);
  check(
    'the city holds its entries',
    entered.lit === entered.holds,
    `${entered.lit} of ${entered.holds}`
  );
  check('other regions stay distant', entered.others === 0, `${entered.others} lit`);
  check('the readout recommends reads', entered.reads === 3, `${entered.reads}`);
  check(
    'the readout offers the whole category',
    /^\/categories\/.+\/$/.test(entered.cta ?? ''),
    String(entered.cta)
  );
  check('the city has a way back', entered.back === 1, `${entered.back}`);

  await tap('.hex[data-hub="ongoing"][data-kind="article"]');
  const opened = await page.evaluate(() => ({
    kicker: document.querySelector('.hexmap-kicker').textContent,
    href: document.querySelector('#hexmap-panel .hexmap-go')?.getAttribute('href'),
  }));
  check('an entry opens a readout', opened.kicker === 'Entry', opened.kicker);
  check('the readout links to the post', /^\/posts\/.+\/$/.test(opened.href ?? ''), String(opened.href));

  // A signpost is a place of its own, one road further out.
  const signpost = await page.evaluate(
    () => document.querySelector('.hex[data-kind="signpost"][data-active]')?.dataset.id
  );
  if (signpost) {
    await tap(`.hex[data-id="${signpost}"]`);
    const outpost = await page.evaluate(() => ({
      place: document.getElementById('hexmap').dataset.place,
      kicker: document.querySelector('.hexmap-kicker').textContent,
      entries: document.querySelectorAll('.hex[data-kind="article"][data-active]').length,
      back: document.querySelectorAll('.hex[data-kind="return"][data-active]').length,
    }));
    check('a signpost leads to an outpost', outpost.kicker === 'Outpost', outpost.kicker);
    check('the outpost holds entries', outpost.entries > 0, `${outpost.entries}`);
    check('the outpost has a way back', outpost.back === 1, `${outpost.back}`);

    await tap(`.hex[data-id="return-${outpost.place}"]`);
    const city = await page.evaluate(() => document.getElementById('hexmap').dataset.place);
    check('leaving an outpost returns to its city', city === 'ongoing', String(city));
  } else {
    check('a signpost leads to an outpost', false, 'no signpost was reachable');
  }

  await tap('.hex[data-id="return-ongoing"]');
  const returned = await page.evaluate(() => document.getElementById('hexmap').dataset.place);
  check('the return tile leads home', returned === 'home', String(returned));

  // Drag, then check both that it moved and that it stopped at the limit.
  const dragged = await page.evaluate(async () => {
    const map = document.getElementById('hexmap');
    const send = (type, x) =>
      map.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: x, clientY: 400, pointerId: 7 })
      );
    send('pointerdown', 200);
    for (let x = 200; x <= 1400; x += 60) send('pointermove', x);
    send('pointerup', 1400);
    await new Promise((r) => setTimeout(r, 900));
    return parseFloat(map.style.getPropertyValue('--drag-x'));
  });
  check('the map can be dragged', dragged > 40, `${dragged}px`);
  check('the drag stops at a quarter of the window', dragged <= 1440 * 0.25 + 1, `${dragged}px`);

  await page.close();
}

/* ---------------------------------------------------- homepage on a phone */
{
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));

  const room = await page.evaluate(() => {
    const map = document.getElementById('hexmap').getBoundingClientRect();
    const panel = document.getElementById('hexmap-panel').getBoundingClientRect();
    const camera = document.querySelector('.hexmap-camera').getBoundingClientRect();
    return {
      mapFits: Math.round(map.height) <= window.innerHeight,
      panelInside: Math.round(panel.bottom) <= window.innerHeight,
      panelHeight: Math.round(panel.height),
      gridAbovePanel: Math.round(camera.top) < Math.round(panel.top),
    };
  });
  check('the map fits the visible window', room.mapFits);
  check('the readout is fully on screen', room.panelInside);
  check('the readout leaves the grid room', room.gridAbovePanel, `${room.panelHeight}px tall`);
  check('the readout is not half the screen', room.panelHeight < 844 * 0.6, `${room.panelHeight}px`);

  // Touching the readout must scroll it, never drag the map underneath.
  await page.evaluate(() => {
    document.getElementById('hexmap').style.setProperty('--drag-x', '0px');
  });
  const held = await page.evaluate(async () => {
    const card = document.querySelector('.hexmap-panel-card');
    const send = (type, y) =>
      card.dispatchEvent(
        new PointerEvent(type, { bubbles: true, clientX: 200, clientY: y, pointerId: 3 })
      );
    send('pointerdown', 700);
    for (let y = 700; y > 400; y -= 30) send('pointermove', y);
    send('pointerup', 400);
    await new Promise((r) => setTimeout(r, 400));
    return document.getElementById('hexmap').style.getPropertyValue('--drag-x');
  });
  check('dragging the readout does not drag the map', held === '0px', String(held));

  // Every reachable tile has to be a real tap target.
  const small = await page.evaluate(() =>
    [...document.querySelectorAll('.hex[role="button"]')]
      .map((tile) => tile.getBoundingClientRect())
      .filter((box) => box.width > 0 && (box.width < 40 || box.height < 40)).length
  );
  check('tiles are big enough to tap', small === 0, `${small} under 40px`);

  // Opening the sidebar and following a link must not leave it sitting there.
  await page.click('#hexmap-nav');
  await new Promise((r) => setTimeout(r, 500));
  const over = await page.evaluate(() => ({
    open: document.documentElement.hasAttribute('sidebar-display'),
    hamburger: getComputedStyle(document.querySelector('#hexmap-nav')).display,
  }));
  check('the map has its own way into the sidebar', over.open);
  check('the sidebar covers its own toggle', over.hamburger === 'none', over.hamburger);

  await page.evaluate(() => document.querySelector('#sidebar .nav-link').click());
  await new Promise((r) => setTimeout(r, 500));
  const after = await page.evaluate(() => document.documentElement.hasAttribute('sidebar-display'));
  check('following a link closes the sidebar', !after);

  await page.close();
}

/* ------------------------------------------------------ homepage map edges */
{
  /*
   * The map drawing under the hex grid must never end with a visible line.
   * Reading the border pixels is the only way to prove that: a mask radius
   * that looks safe at one window size reaches past the edge at another, and
   * nothing in the CSS says so.
   *
   * The grid itself is hidden first. Tiles running off the edge are the point
   * of the design, so leaving them in would measure the wrong thing.
   */
  for (const [width, height] of [
    [1440, 900],
    [1920, 1080],
    [1280, 720],
    [390, 844],
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 500));

    const background = await page.evaluate(() => {
      document.querySelector('.hexmap-camera').style.display = 'none';
      return getComputedStyle(document.getElementById('hexmap')).backgroundColor;
    });
    const shot = await page.screenshot({ encoding: 'base64' });
    await page.close();

    const probe = await browser.newPage();
    const worst = await probe.evaluate(
      async (data, bg) => {
        const image = new Image();
        image.src = `data:image/png;base64,${data}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const [er, eg, eb] = bg.match(/\d+/g).map(Number);

        let max = 0;
        const inspect = (x, y) => {
          const at = (y * canvas.width + x) * 4;
          max = Math.max(
            max,
            Math.abs(pixels[at] - er),
            Math.abs(pixels[at + 1] - eg),
            Math.abs(pixels[at + 2] - eb)
          );
        };
        // The sidebar owns the left edge, so that side is skipped.
        for (let x = 0; x < canvas.width; x += 4) {
          inspect(x, 1);
          inspect(x, canvas.height - 2);
        }
        for (let y = 0; y < canvas.height; y += 4) inspect(canvas.width - 2, y);
        return max;
      },
      shot,
      background
    );
    await probe.close();

    check(
      `map fades out before the edge at ${width}x${height}`,
      worst <= 3,
      `worst channel drift ${worst}`
    );
  }
}

await browser.close();

let failed = 0;
for (const result of results) {
  if (!result.ok) failed += 1;
  console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? `  - ${result.detail}` : ''}`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
