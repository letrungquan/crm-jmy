const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://business-api.tiktok.com/portal/docs?id=1771101027431425', { waitUntil: 'networkidle' });
  const title = await page.title();
  const h1 = await page.evaluate(() => Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.innerText));
  console.log('Title:', title);
  console.log('Headers:', h1);
  await browser.close();
})();
