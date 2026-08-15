#!/usr/bin/env node
/**
 * The original avatar is a 12MB SVG with an embedded bitmap, downloaded on
 * every page view. It is displayed at 112x112, so this renders small raster
 * copies plus a social preview image.
 *
 *   node scripts/build-avatar.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const IMAGES = path.join(process.cwd(), 'public', 'assets', 'images');
const source = path.join(IMAGES, 'willDrawn.svg');

if (!fs.existsSync(source)) {
  console.error(`Missing ${source}`);
  process.exit(1);
}

const svg = fs.readFileSync(source);

// Avatar: 2x the 112px display size, plus a 1x fallback.
for (const size of [112, 224]) {
  const out = path.join(IMAGES, `avatar-${size}.png`);
  await sharp(svg, { density: 300, limitInputPixels: false })
    .resize(size, size, { fit: 'cover' })
    .png({ compressionLevel: 9, palette: true })
    .toFile(out);
  console.log(`${path.basename(out)}: ${(fs.statSync(out).size / 1024).toFixed(1)}KB`);
}

// Social preview: the theme used the same huge SVG, which most platforms reject.
const ogPath = path.join(IMAGES, 'og-image.jpg');
const avatar = await sharp(svg, { density: 300, limitInputPixels: false })
  .resize(420, 420, { fit: 'cover' })
  .png()
  .toBuffer();

await sharp({
  create: { width: 1200, height: 630, channels: 4, background: '#f7f7f7' },
})
  .composite([{ input: avatar, top: 105, left: 390 }])
  .jpeg({ quality: 86, mozjpeg: true })
  .toFile(ogPath);

console.log(`og-image.jpg: ${(fs.statSync(ogPath).size / 1024).toFixed(1)}KB`);
