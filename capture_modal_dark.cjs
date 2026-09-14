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
  
  // Switch to dark theme
  await page.evaluate(() => {
    localStorage.setItem('meme_creator_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1500));
  
  // Click first meme template
  await page.evaluate(() => {
    const card = document.querySelector('.template-card');
    if (card) card.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  // Click Stickers tab
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('.tab-btn'));
    const s = tabs.find(t => t.textContent.includes('Stickers'));
    if (s) s.click();
  });
  await new Promise(r => setTimeout(r, 1000));

  // Click Emoji button to open Emoji modal
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('.btn-secondary, button'));
    const emojiBtn = btns.find(b => b.textContent.includes('Emojis'));
    if (emojiBtn) emojiBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  
  await page.screenshot({ path: 'C:\\Users\\jigar\\.gemini\\antigravity-ide\\brain\\8716f9bf-6c46-4835-bd18-077ce6776fce\\modal_dark_blue.png' });

  await browser.close();
  console.log('Modal screenshot captured');
})();
