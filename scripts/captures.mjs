// Génère les captures du haut de page des maquettes du portfolio.
// Usage : npm run captures            (toutes les maquettes)
//         npm run captures -- soif    (une ou plusieurs maquettes)
import { chromium } from 'playwright';
import sharp from 'sharp';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'portfolio', 'captures');
const SLUGS = ['soif', 'vigie', 'rankshift', 'gem-renov', 'azimut', 'copamo'];

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, maxWidth: 1600 },
  mobile: {
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    maxWidth: 780,
  },
};
const QUALITY = 82;
const MAX_TRIES = 3;
const BUDGET_KO = 250;

// Injecté avant tout script de la page : chaque élément observé est
// immédiatement déclaré visible, pour déclencher les apparitions au scroll.
const FORCE_VISIBLE = () => {
  const Native = window.IntersectionObserver;
  if (!Native) return;
  window.IntersectionObserver = class {
    constructor(cb) { this.cb = cb; }
    observe(el) {
      const r = el.getBoundingClientRect();
      queueMicrotask(() => this.cb([{
        target: el, isIntersecting: true, intersectionRatio: 1,
        boundingClientRect: r, intersectionRect: r, rootBounds: null, time: performance.now(),
      }], this));
    }
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  };
};

async function settle(page) {
  await page.evaluate(async () => {
    document.querySelectorAll('.rv, .reveal').forEach((el) => el.classList.add('in'));
    await document.fonts.ready;
  });
  // Laisse les transitions d'apparition se terminer
  await page.waitForTimeout(1500);
  // Toutes les images visibles dans le premier écran doivent être décodées
  return page.evaluate(async () => {
    const vh = window.innerHeight;
    const imgs = [...document.images].filter((img) => {
      const r = img.getBoundingClientRect();
      return r.bottom > 0 && r.top < vh && r.width > 0;
    });
    imgs.forEach((img) => { img.loading = 'eager'; });
    await Promise.all(imgs.map((img) => (img.complete ? null
      : new Promise((ok) => { img.onload = img.onerror = ok; setTimeout(ok, 15000); }))));
    await Promise.all(imgs.map((img) => img.decode?.().catch(() => null)));
    return imgs.filter((img) => !img.naturalWidth).map((img) => img.currentSrc || img.src);
  });
}

async function capture(browser, slug, kind) {
  const { maxWidth, ...ctxOpts } = VIEWPORTS[kind];
  const url = pathToFileURL(path.join(ROOT, 'portfolio', slug, 'index.html')).href;
  for (let attempt = 1; attempt <= MAX_TRIES; attempt++) {
    const context = await browser.newContext({ ...ctxOpts, reducedMotion: 'no-preference' });
    await context.addInitScript(FORCE_VISIBLE);
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      const broken = await settle(page);
      if (broken.length && attempt < MAX_TRIES) {
        console.warn(`  ${slug}/${kind} : ${broken.length} image(s) manquante(s), nouvel essai`);
        continue;
      }
      if (broken.length) console.warn(`  ${slug}/${kind} : images toujours manquantes`, broken);
      const png = await page.screenshot({ type: 'png' });
      const file = path.join(OUT, `${slug}-${kind}.webp`);
      const info = await sharp(png)
        .resize({ width: maxWidth, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toFile(file);
      const ko = Math.round(info.size / 1024);
      console.log(`${slug}-${kind}.webp  ${info.width}×${info.height}  ${ko} Ko${ko > BUDGET_KO ? '  ⚠ au-dessus de 250 Ko' : ''}`);
      if (slug === 'soif' && kind === 'desktop') {
        // Image de partage Open Graph : JPEG 1200×630, lu par tous les réseaux
        await sharp(png).resize(1200, 630, { fit: 'cover', position: 'top' })
          .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, 'soif-og.jpg'));
      }
      return;
    } finally {
      await context.close();
    }
  }
}

const only = process.argv.slice(2);
const slugs = only.length ? SLUGS.filter((s) => only.includes(s)) : SLUGS;
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--hide-scrollbars'] });
try {
  for (const slug of slugs) {
    for (const kind of Object.keys(VIEWPORTS)) await capture(browser, slug, kind);
  }
} finally {
  await browser.close();
}
