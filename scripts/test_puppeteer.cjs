const puppeteer = require('puppeteer-core');

async function test() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("Navigating to https://unstop.com/auth/login...");
  await page.goto('https://unstop.com/auth/login', { waitUntil: 'networkidle2', timeout: 30000 });
  console.log("Page title:", await page.title());

  await page.screenshot({ path: '/tmp/unstop_login_page.png' });
  console.log("Screenshot saved to /tmp/unstop_login_page.png");

  await browser.close();
}

test().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
