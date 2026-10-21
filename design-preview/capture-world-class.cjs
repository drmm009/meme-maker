const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const previewDir = path.join(__dirname, 'screenshots');
const artifactDir = 'C:/Users/jigar/.gemini/antigravity/brain/66927a66-2304-496c-99b5-67d4742b54fb/screenshots';

const screens = ['discovery', 'editor', 'video', 'gallery', 'sheet', 'ai', 'empty'];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,1024']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1024, deviceScaleFactor: 2 });

  const url = 'file://' + path.join(__dirname, 'world-class-curved.html').replace(/\\/g, '/');
  console.log('Loading:', url);
  await page.goto(url, { waitUntil: 'networkidle0' });

  for (const s of screens) {
    await page.evaluate((sc) => {
      if (typeof showScreen === 'function') showScreen(sc);
    }, s);

    await new Promise(r => setTimeout(r, 200));

    const phone = await page.$('.phone-mockup');
    if (phone) {
      const filename = 'world-class-' + s + '.png';
      const out1 = path.join(previewDir, filename);
      const out2 = path.join(artifactDir, filename);
      await phone.screenshot({ path: out1 });
      fs.copyFileSync(out1, out2);
      console.log('Captured & copied:', filename);
    }
  }

  // Also capture Dark Mode of Editor & Discovery
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    if (typeof showScreen === 'function') showScreen('editor');
  });
  await new Promise(r => setTimeout(r, 200));
  const phoneDarkEditor = await page.$('.phone-mockup');
  if (phoneDarkEditor) {
    const filenameDark = 'world-class-editor-dark.png';
    const out1Dark = path.join(previewDir, filenameDark);
    const out2Dark = path.join(artifactDir, filenameDark);
    await phoneDarkEditor.screenshot({ path: out1Dark });
    fs.copyFileSync(out1Dark, out2Dark);
    console.log('Captured & copied dark editor:', filenameDark);
  }

  await page.evaluate(() => {
    if (typeof showScreen === 'function') showScreen('discovery');
  });
  await new Promise(r => setTimeout(r, 200));
  const phoneDarkDisc = await page.$('.phone-mockup');
  if (phoneDarkDisc) {
    const filenameDarkDisc = 'world-class-discovery-dark.png';
    const out1DarkDisc = path.join(previewDir, filenameDarkDisc);
    const out2DarkDisc = path.join(artifactDir, filenameDarkDisc);
    await phoneDarkDisc.screenshot({ path: out1DarkDisc });
    fs.copyFileSync(out1DarkDisc, out2DarkDisc);
    console.log('Captured & copied dark discovery:', filenameDarkDisc);
  }

  await browser.close();
  console.log('Finished capturing all world-class screens!');
})();
