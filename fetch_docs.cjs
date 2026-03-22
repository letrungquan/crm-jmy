const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://business-api.tiktok.com/portal/docs?id=1771101027431425');
  await page.waitForTimeout(5000);
  const content = await page.evaluate(() => document.body.innerText);
  console.log(content);
  await browser.close();
})();
