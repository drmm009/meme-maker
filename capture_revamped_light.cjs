const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5175/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1000));
  
  // Switch to light theme
  await page.evaluate(() => {
    localStorage.setItem('meme_creator_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  
  // Click first meme template
  await page.evaluate(() => {
    const card = document.querySelector('.template-card');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'C:\\Users\\jigar\\.gemini\\antigravity-ide\\brain\\8716f9bf-6c46-4835-bd18-077ce6776fce\\revamped_meme_editor_light.png' });

  // Return home and go to Video Builder
  await page.goto('http://localhost:5175/', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button, a'));
    const b = btns.find(el => el.textContent.includes('Video Builder'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  
  // Click Blank Canvas to enter Video Editor
  await page.evaluate(() => {
    const card = document.querySelector('.icon-layout-card');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 2500));
  await page.screenshot({ path: 'C:\\Users\\jigar\\.gemini\\antigravity-ide\\brain\\8716f9bf-6c46-4835-bd18-077ce6776fce\\revamped_video_editor_light.png' });

  await browser.close();
  console.log('Video editor screenshot captured');
})();
