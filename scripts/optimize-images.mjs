#!/usr/bin/env node
/**
 * Image preparation for `public/assets`.
 *
 *   node scripts/optimize-images.mjs [--dry] [--from <dir>]
 *
 * Nothing here is allowed to soften an image: photographs keep full colour
 * depth (no palette quantisation) and only images wider than the largest size
 * the layout can display are downscaled. File names are preserved so existing
 * Markdown keeps working.
 *
 * The post column is at most 813px wide, so 1600px covers a 2x display.
 *
 * Drop new artwork into public/assets/posts/<slug>/ and run this; it edits in
 * place. Use --from <dir> to pull from a folder of originals instead.
 *
 * Fonts and favicons are skipped. A favicon is generated at an exact size for
 * a reason, and re-encoding one is how a tab icon quietly turns to mush.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.join(process.cwd(), 'public', 'assets');
const SKIP = ['fonts', 'favicons'];
const MAX_WIDTH = 1600;
const DRY = process.argv.includes('--dry');

const fromIndex = process.argv.indexOf('--from');
const SOURCE = fromIndex > -1 ? path.resolve(process.argv[fromIndex + 1]) : ROOT;

const format = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/**
 * A palette is only safe for flat graphics. Photographs and screenshots with
 * gradients band badly when quantised, which reads as blur once the browser
 * scales them down.
 */
async function isFlatGraphic(image) {
  const { channels } = await image.stats();
  const spread = channels.slice(0, 3).reduce((total, c) => total + c.stdev, 0) / 3;
  return spread < 40;
}

let before = 0;
let after = 0;

for (const file of walk(SOURCE)) {
  const extension = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) continue;

  // Read into memory first: on Windows sharp keeps the source file open, which
  // blocks writing the optimised version back to the same path.
  const input = fs.readFileSync(file);
  const original = input.length;
  before += original;

  const target = path.join(ROOT, path.relative(SOURCE, file));
  const image = sharp(input, { limitInputPixels: false });
  const meta = await image.metadata();
  const resized =
    meta.width && meta.width > MAX_WIDTH
      ? image.resize({ width: MAX_WIDTH, kernel: 'lanczos3' })
      : image;

  let encoded;
  if (extension === '.png') {
    const flat = await isFlatGraphic(sharp(input, { limitInputPixels: false }));
    encoded = await resized
      .png({ compressionLevel: 9, effort: 10, palette: flat, quality: flat ? 100 : undefined })
      .toBuffer();
  } else if (extension === '.webp') {
    encoded = await resized.webp({ quality: 92, effort: 6 }).toBuffer();
  } else {
    encoded = await resized.jpeg({ quality: 90, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
  }

  const resizedOnly = meta.width && meta.width > MAX_WIDTH;
  const worthIt = encoded.length < original * 0.97 || resizedOnly;

  fs.mkdirSync(path.dirname(target), { recursive: true });
  if (!DRY) fs.writeFileSync(target, worthIt ? encoded : input);
  after += worthIt ? encoded.length : original;

  if (worthIt) {
    console.log(
      `${path.relative(SOURCE, file)}: ${format(original)} -> ${format(encoded.length)}${DRY ? ' (dry run)' : ''}`
    );
  }
}

console.log(`\nTotal: ${format(before)} -> ${format(after)}`);
