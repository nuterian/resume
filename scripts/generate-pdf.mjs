#!/usr/bin/env node
// Renders the built site (dist/) to a PDF with Playwright Chromium,
// writes it into dist/ so it deploys alongside the page, and fails
// the build if the resume no longer fits on exactly one page.
import { createServer } from 'node:http';
import { readFile, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { chromium } from 'playwright';
import { PDFDocument } from 'pdf-lib';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const BASE = '/resume';

// The resume must be one page AND look like it was designed for one page:
// content has to reach at least this far down the sheet.
const MIN_FILL = 0.92;

const { pdfFilename } = yaml.load(
  readFileSync(join(root, 'src/data/resume.yaml'), 'utf8'),
);

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

// Minimal static server mounting dist/ at the deployed base path,
// so asset URLs resolve exactly as they will on GitHub Pages.
const server = createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === BASE || path === `${BASE}/`) path = `${BASE}/index.html`;
  if (!path.startsWith(`${BASE}/`)) {
    res.writeHead(404).end();
    return;
  }
  const file = normalize(join(dist, path.slice(BASE.length + 1)));
  if (!file.startsWith(dist)) {
    res.writeHead(403).end();
    return;
  }
  readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404).end();
      return;
    }
    res
      .writeHead(200, {
        'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      })
      .end(data);
  });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();

const browser = await chromium.launch();
try {
  // Letter at 96dpi, so measurements below reflect the printed layout.
  const page = await browser.newPage({
    viewport: { width: 8.5 * 96, height: 11 * 96 },
  });
  await page.goto(`http://127.0.0.1:${port}${BASE}/`, {
    waitUntil: 'networkidle',
  });
  await page.evaluate(() => document.fonts.ready);

  const pdf = await page.pdf({
    preferCSSPageSize: true,
    printBackground: true,
  });

  // How much of the printed page does the content actually cover? A resume
  // that stops two-thirds down looks unfinished, so this is enforced too.
  await page.emulateMedia({ media: 'print' });
  const fill = await page.evaluate(() => {
    const PAGE_H = 11 * 96; // Letter height in CSS px at 96dpi
    // The sheet's own box, not scrollHeight — the latter never reports
    // less than the viewport, which silently floors every result at 100%.
    return document.querySelector('.sheet').getBoundingClientRect().height / PAGE_H;
  });
  await page.emulateMedia({ media: 'screen' });

  const pct = (fill * 100).toFixed(1);
  const pageCount = (await PDFDocument.load(pdf)).getPageCount();

  if (pageCount !== 1) {
    console.error(
      `✗ Resume is ${pageCount} pages (content fills ${pct}% of one page) — it must fit on exactly one. Trim content or tighten print styles.`,
    );
    process.exit(1);
  }

  if (fill < MIN_FILL) {
    console.error(
      `✗ Content fills only ${pct}% of the page (minimum ${MIN_FILL * 100}%). The page would look unfinished — add content or open up the type scale.`,
    );
    process.exit(1);
  }

  // dist/ is what gets deployed; public/ is what the dev server serves (and
  // what any later `astro build` copies through), so the download link works
  // in both places.
  const outPath = join(dist, pdfFilename);
  await writeFile(outPath, pdf);
  await writeFile(join(root, 'public', pdfFilename), pdf);
  console.log(`✓ Wrote 1-page PDF to ${outPath} — content fills ${pct}% of the page`);
} finally {
  await browser.close();
  server.close();
}
