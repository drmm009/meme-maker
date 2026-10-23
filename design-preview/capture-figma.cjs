const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const outDir = 'C:/Users/jigar/.gemini/antigravity/brain/66927a66-2304-496c-99b5-67d4742b54fb/screenshots';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Desktop Side-by-Side (Dark)
  await page.setViewport({ width: 1400, height: 980, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5175/design-preview/figma-class-studio.html', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'figma-class-overview-dark.png') });
  console.log('Saved figma-class-overview-dark.png');

  // Desktop Side-by-Side (Light)
  await page.evaluate(() => {
    switchTheme('light');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(outDir, 'figma-class-overview-light.png') });
  console.log('Saved figma-class-overview-light.png');

  // Individual Mobile Frames
  const discoveryEl = await page.$('#view-discovery');
  if (discoveryEl) {
    // Light Discovery
    await discoveryEl.screenshot({ path: path.join(outDir, 'figma-class-discovery-light.png') });
    console.log('Saved figma-class-discovery-light.png');

    // Dark Discovery
    await page.evaluate(() => switchTheme('dark'));
    await new Promise(r => setTimeout(r, 400));
    await discoveryEl.screenshot({ path: path.join(outDir, 'figma-class-discovery-dark.png') });
    console.log('Saved figma-class-discovery-dark.png');
  }

  const editorEl = await page.$('#view-editor');
  if (editorEl) {
    // Dark Editor
    await editorEl.screenshot({ path: path.join(outDir, 'figma-class-editor-dark.png') });
    console.log('Saved figma-class-editor-dark.png');

    // Light Editor
    await page.evaluate(() => switchTheme('light'));
    await new Promise(r => setTimeout(r, 400));
    await editorEl.screenshot({ path: path.join(outDir, 'figma-class-editor-light.png') });
    console.log('Saved figma-class-editor-light.png');
  }

  const videoEl = await page.$('#view-video');
  if (videoEl) {
    // Light Video
    await videoEl.screenshot({ path: path.join(outDir, 'figma-class-video-light.png') });
    console.log('Saved figma-class-video-light.png');

    // Dark Video
    await page.evaluate(() => switchTheme('dark'));
    await new Promise(r => setTimeout(r, 400));
    await videoEl.screenshot({ path: path.join(outDir, 'figma-class-video-dark.png') });
    console.log('Saved figma-class-video-dark.png');
  }

  await browser.close();
  console.log('All Figma-class captures complete!');
})();
