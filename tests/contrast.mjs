/**
 * Colour contrast, both modes, against the real rendered page.
 *
 *   node tests/contrast.mjs
 *
 * Samples the text that carries meaning, resolves the background actually
 * behind it, and applies the WCAG AA thresholds: 4.5:1 for body text, 3:1 once
 * the type is large.
 */
import puppeteer from 'puppeteer';

const BASE = process.env.LOCAL ?? 'http://localhost:4000';

const REGIONS = ['ai', 'gaming', 'news', 'product', 'projects', 'misc'];

const SAMPLES = [
  { route: '/articles/', selector: '#post-list .card-title', label: 'card title' },
  { route: '/articles/', selector: '#post-list .card-text p', label: 'card excerpt' },
  { route: '/articles/', selector: '#post-list .post-meta time', label: 'card date' },
  { route: '/articles/', selector: '#access-lastmod a', label: 'panel link' },
  { route: '/articles/', selector: '#panel-wrapper .post-tag', label: 'trending tag' },
  { route: '/articles/', selector: '#sidebar .nav-link', label: 'sidebar link' },
  { route: '/articles/', selector: 'footer p', label: 'footer' },
  { route: '/posts/why-indie-games-fail/', selector: '.content p', label: 'body text' },
  { route: '/posts/why-indie-games-fail/', selector: '.content a', label: 'prose link' },
  { route: '/posts/why-indie-games-fail/', selector: '.content h2', label: 'heading' },
  { route: '/posts/why-indie-games-fail/', selector: '#toc .toc-link', label: 'contents link' },
  { route: '/posts/why-indie-games-fail/', selector: '.related-title', label: 'related title' },
  { route: '/posts/why-indie-games-fail/', selector: '.related-meta', label: 'related meta' },
  { route: '/posts/why-indie-games-fail/', selector: '.readtime', label: 'read time' },
  { route: '/categories/', selector: '.categories .card-header a', label: 'category link' },
  { route: '/categories/', selector: '#tags .tag', label: 'tag pill' },
  { route: '/archives/', selector: '#archives a', label: 'archive link' },
  { route: '/about/', selector: '.content li', label: 'about list item' },

  /*
   * The homepage map paints with `fill` and `stroke`, not `color` and
   * `background-color`, so these samples name the tile the ink sits on.
   * A region reveals its colour on hover, which is the state that has to be
   * legible, so those samples ask for the hover first.
   */
  {
    route: '/',
    paint: { prop: 'fill', behind: '.hex[data-kind="gateway"] .hex-face' },
    selector: '.hex[data-kind="gateway"] .hex-label',
    label: 'hex label',
  },
  {
    route: '/',
    paint: { prop: 'stroke', behind: '.hex[data-kind="home"] .hex-face' },
    selector: '.hex[data-kind="home"] .hex-mark',
    label: 'hex mark',
    minRatio: 3,
  },
  {
    route: '/',
    paint: { prop: 'stroke', behind: '.hex[data-kind="home"] .hex-face' },
    selector: '.hex[data-kind="home"] .hex-edge',
    hover: '.hex[data-kind="home"]',
    label: 'hex edge active',
    minRatio: 3,
  },
  ...REGIONS.map((region) => ({
    route: '/',
    paint: { prop: 'fill', behind: `.hex[data-id="gateway-${region}"] .hex-face` },
    selector: `.hex[data-id="gateway-${region}"] .hex-label`,
    hover: `.hex[data-id="gateway-${region}"]`,
    label: `hex ${region} active`,
  })),

  /*
   * The readout. It is ordinary HTML over a translucent card, so the usual
   * measure works, but half of it only exists once you have travelled to a
   * city and picked an entry: those samples click their way there first.
   */
  { route: '/', selector: '.hexmap-kicker', label: 'panel kicker' },
  { route: '/', selector: '#hexmap-panel h2', label: 'panel title' },
  { route: '/', selector: '.hexmap-lede', label: 'panel lede' },
  { route: '/', selector: '.hexmap-hint', label: 'panel hint' },
  {
    route: '/',
    clicks: ['.hex[data-id="gateway-news"]'],
    selector: '.hexmap-subhead',
    label: 'panel subhead',
  },
  {
    route: '/',
    clicks: ['.hex[data-id="gateway-news"]'],
    selector: '.hexmap-list a',
    label: 'panel read',
  },
  {
    route: '/',
    clicks: ['.hex[data-id="gateway-news"]'],
    selector: '.hexmap-go',
    label: 'panel button',
  },
  {
    route: '/',
    clicks: ['.hex[data-id="gateway-news"]'],
    selector: '.hexmap-back',
    label: 'panel back',
  },
  {
    route: '/',
    clicks: ['.hex[data-id="gateway-news"]', '.hex[data-kind="article"][data-active]'],
    selector: '.hexmap-meta',
    label: 'panel meta',
  },
];

/*
 * Chrome reports anything that came from color-mix() as `color(srgb r g b)`
 * with channels in 0..1, not as `rgb()` with channels in 0..255. Reading those
 * floats as bytes makes every mixed colour look like near-black, which reads
 * as a 1.00:1 failure that is not real. Both measure functions use this.
 */
const PARSE = `const parse = (value) => {
  const nums = (value.match(/[\\d.]+/g) ?? []).map(Number);
  if (value.startsWith('color(')) {
    return { r: nums[0] * 255, g: nums[1] * 255, b: nums[2] * 255, a: nums[3] ?? 1 };
  }
  const [r, g, b, a = 1] = nums;
  return { r, g, b, a };
};`;

const MEASURE = `(selector) => {
  ${PARSE}
  const element = document.querySelector(selector);
  if (!element) return null;
  const style = getComputedStyle(element);
  const colour = parse(style.color);

  // Collect every background from the element up to the root, then composite
  // them. Translucent layers such as rgba(0,0,0,.03) sit on top of whatever is
  // behind them; treating one as opaque would report a wildly wrong ratio.
  const layers = [];
  for (let node = element; node; node = node.parentElement) {
    const bg = parse(getComputedStyle(node).backgroundColor);
    if (bg.a > 0) layers.push(bg);
    if (bg.a === 1) break;
  }
  if (layers.length === 0 || layers[layers.length - 1].a < 1) {
    layers.push({ r: 255, g: 255, b: 255, a: 1 });
  }

  let background = layers[layers.length - 1];
  for (let i = layers.length - 2; i >= 0; i -= 1) {
    const top = layers[i];
    background = {
      r: top.r * top.a + background.r * (1 - top.a),
      g: top.g * top.a + background.g * (1 - top.a),
      b: top.b * top.a + background.b * (1 - top.a),
      a: 1,
    };
  }

  return {
    colour,
    background,
    fontSize: parseFloat(style.fontSize),
    fontWeight: Number(style.fontWeight) || 400,
  };
}`;

/**
 * SVG paints with `fill` and `stroke` and has no background to walk up to, so
 * the tile the ink sits on is named by the sample instead of discovered.
 */
const PAINT_MEASURE = `(sample) => {
  ${PARSE}
  const element = document.querySelector(sample.selector);
  const backdrop = document.querySelector(sample.paint.behind);
  const map = document.getElementById('hexmap');
  if (!element || !backdrop || !map) return null;

  const over = (top, under) => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  });

  const style = getComputedStyle(element);
  const tile = parse(getComputedStyle(backdrop).fill);
  if (!Number.isFinite(tile.r)) return null;

  /*
   * The tiles are translucent and the drawn map shows through them, so there
   * is no single background to measure against. The map is bounded: it can
   * never be darker than black at --map-wash over the page, nor lighter than
   * white at the same opacity. Compositing the tile over both extremes gives
   * the two worst cases, and the sample has to clear the threshold on each.
   */
  const page = parse(getComputedStyle(map).backgroundColor);
  const wash = parseFloat(getComputedStyle(map).getPropertyValue('--map-wash')) || 0;
  const grounds = [0, 255].map((ink) => over({ r: ink, g: ink, b: ink, a: wash }, page));

  return {
    colour: parse(style[sample.paint.prop]),
    backgrounds: grounds.map((ground) => over(tile, ground)),
    fontSize: parseFloat(style.fontSize),
    fontWeight: Number(style.fontWeight) || 400,
  };
}`;

const luminance = ({ r, g, b }) => {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};

const contrast = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const problems = [];
const measured = [];

for (const mode of ['light', 'dark']) {
  for (const sample of SAMPLES) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1000 });
    await page.evaluateOnNewDocument((value) => {
      window.localStorage.setItem('mode', value);
    }, mode);
    await page.goto(BASE + sample.route, { waitUntil: 'networkidle0' });
    await page.evaluate((value) => document.documentElement.setAttribute('data-mode', value), mode);

    // Some of the readout only exists once you have travelled somewhere.
    for (const selector of sample.clicks ?? []) {
      const box = await (await page.$(selector))?.boundingBox();
      if (!box) continue;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.up();
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }

    // Hovered colours cross-fade, so reading them straight away measures a
    // frame part-way through the transition rather than the resting state.
    if (sample.hover) {
      await page.hover(sample.hover);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    const result = sample.paint
      ? await page.evaluate(new Function(`return ${PAINT_MEASURE}`)(), {
          selector: sample.selector,
          paint: sample.paint,
        })
      : await page.evaluate(new Function(`return ${MEASURE}`)(), sample.selector);
    await page.close();

    if (!result) {
      problems.push(`${mode}  ${sample.label}: nothing matched ${sample.selector}`);
      continue;
    }

    // A sample may report several possible backgrounds; the worst one decides.
    const backgrounds = result.backgrounds ?? [result.background];
    const ratio = Math.min(...backgrounds.map((background) => contrast(result.colour, background)));
    const large = result.fontSize >= 24 || (result.fontSize >= 18.66 && result.fontWeight >= 700);
    const required = sample.minRatio ?? (large ? 3 : 4.5);
    measured.push(`${mode.padEnd(5)} ${sample.label.padEnd(18)} ${ratio.toFixed(2)}:1`);
    if (ratio < required) {
      problems.push(
        `${mode}  ${sample.label}: ${ratio.toFixed(2)}:1, needs ${required}:1 (${sample.route})`
      );
    }
  }
}

await browser.close();

for (const line of measured) console.log(`  ${line}`);

if (problems.length) {
  console.error(`\ncontrast checks failed (${problems.length}):`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log(`\ncontrast ok - ${measured.length} samples across light and dark`);
