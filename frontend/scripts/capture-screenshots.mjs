/**
 * Captures real app screenshots for the landing-page walkthrough.
 *
 * Usage:  node scripts/capture-screenshots.mjs
 * Requires: the app running at http://localhost:3000
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'screenshots');
const BASE = process.env.APP_URL || 'http://localhost:3000';

const VIEWPORT = { width: 1440, height: 900 };
const DEVICE_SCALE_FACTOR = 2; // retina

const UNIPROT = 'A0A7I2V3N4'; // ACE2 — populated in current DB

const pages = [
  {
    id: 'pockets',
    url: `/app/target/${UNIPROT}`,
    // wait for structure viewer + pockets panel
    waitFor: 'canvas',
    settle: 4000,
  },
  {
    id: 'ligands',
    url: `/app/target/${UNIPROT}/pocket/1`,
    waitFor: 'table',
    settle: 3500,
  },
  {
    id: 'prediction',
    url: `/app/target/${UNIPROT}/compare`,
    waitFor: 'h1',
    settle: 2000,
  },
  {
    id: 'antibody',
    url: `/app/antibody`,
    waitFor: 'textarea',
    settle: 1500,
  },
  {
    id: 'analytics',
    url: `/app/analytics`,
    waitFor: '.recharts-wrapper, h1',
    settle: 2500,
  },
  {
    id: 'dashboard',
    url: `/app/dashboard`,
    waitFor: 'h1',
    settle: 1500,
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: DEVICE_SCALE_FACTOR,
    colorScheme: 'dark',
  });
  const page = await context.newPage();

  for (const p of pages) {
    const url = `${BASE}${p.url}`;
    console.log(`→ ${p.id}: ${url}`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      try {
        await page.waitForSelector(p.waitFor, { timeout: 15_000 });
      } catch {
        console.warn(`   (selector ${p.waitFor} not found — continuing)`);
      }
      await page.waitForTimeout(p.settle);
      const out = join(OUT_DIR, `${p.id}.png`);
      await page.screenshot({ path: out, fullPage: false });
      console.log(`   saved → ${out}`);
    } catch (err) {
      console.error(`   failed: ${err.message}`);
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
