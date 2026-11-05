// Rasterizes the vector logos in data/logos.json into 512x512 grayscale masks
// (data/logo-<name>.png). The masks are the source for traveller sampling.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const logos = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/logos.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 512, height: 512 } });
  for (const [name, l] of Object.entries(logos)) {
    const body = l.fill
      ? `<path d="${l.fill}" fill="#fff"/>`
      : l.stroke.map((d) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="${l.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
    await page.setContent(`<html><body style="margin:0;background:#000"><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="${l.viewBox}">${body}</svg></body></html>`);
    await page.screenshot({ path: path.join(__dirname, `data/logo-${name}.png`), clip: { x: 0, y: 0, width: 512, height: 512 } });
    console.log('mask', name);
  }
  await browser.close();
})();
