#!/usr/bin/env node
/**
 * One-off image optimiser for `public/assets/images`.
 *
 *   node scripts/optimize-images.mjs [--dry]
 *
 * Content images are never displayed wider than ~820 CSS pixels, so anything
 * wider than 1600px is downscaled and everything is recompressed in place.
 * File names are preserved so existing Markdown keeps working.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.join(process.cwd(), 'public', 'assets', 'images');
const MAX_WIDTH = 1600;
const DRY = process.argv.includes('--dry');

const format = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)}MB`;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let before = 0;
let after = 0;

for (const file of walk(ROOT)) {
  const extension = path.extname(file).toLowerCase();
  if (!['.png', '.jpg', '.jpeg', '.webp'].includes(extension)) continue;

  // Read into memory first: on Windows sharp keeps the source file open, which
  // blocks writing the optimised version back to the same path.
  const input = fs.readFileSync(file);
  const original = input.length;
  before += original;

  const image = sharp(input, { limitInputPixels: false });
  const meta = await image.metadata();
  const pipeline = meta.width && meta.width > MAX_WIDTH ? image.resize({ width: MAX_WIDTH }) : image;

  const encoded =
    extension === '.png'
      ? await pipeline.png({ compressionLevel: 9, palette: true, quality: 92 }).toBuffer()
      : extension === '.webp'
        ? await pipeline.webp({ quality: 86 }).toBuffer()
        : await pipeline.jpeg({ quality: 84, mozjpeg: true }).toBuffer();

  if (encoded.length < original * 0.97) {
    if (!DRY) fs.writeFileSync(file, encoded);
    after += encoded.length;
    console.log(
      `${path.relative(ROOT, file)}: ${format(original)} -> ${format(encoded.length)}${DRY ? ' (dry run)' : ''}`
    );
  } else {
    after += original;
  }
}

console.log(`\nTotal: ${format(before)} -> ${format(after)}`);
