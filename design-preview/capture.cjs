const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const screenshotDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const directions = [
  { name: 'direction-1', file: 'direction-1.html' },
  { name: 'direction-2', file: 'direction-2.html' },
  { name: 'direction-3', file: 'direction-3.html' }
];

const screens = ['discovery', 'editor', 'video', 'gallery', 'sheet', 'ai', 'empty'];

(async () => {
  console.log('Launching headless Chrome for screenshot exports...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1024']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024, deviceScaleFactor: 2 });

  // 1. Capture Master Overview
  const masterPath = 'file://' + path.join(__dirname, 'index.html').replace(/\\/g, '/');
  console.log('Capturing master showcase from:', masterPath);
  await page.goto(masterPath, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(screenshotDir, 'overview-master.png'), fullPage: true });
  console.log('Saved overview-master.png');

  // 2. Capture Each Screen in Each Direction
  for (const dir of directions) {
    const dirPath = 'file://' + path.join(__dirname, dir.file).replace(/\\/g, '/');
    console.log(`Loading ${dir.name}...`);
    await page.goto(dirPath, { waitUntil: 'networkidle0' });

    for (const screen of screens) {
      // Trigger switchScreen in page
      await page.evaluate((s) => {
        if (typeof switchScreen === 'function') switchScreen(s);
      }, screen);

      await new Promise(r => setTimeout(r, 200));

      const phoneElement = await page.$('.phone-container');
      if (phoneElement) {
        const outName = `${dir.name}-${screen}.png`;
        await phoneElement.screenshot({ path: path.join(screenshotDir, outName) });
        console.log(`Captured ${outName}`);
      }
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully!');
})();
