const puppeteer = require('puppeteer-core');

async function testPasswordLogin() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log("Navigating to https://unstop.com/auth/login?login_as=recruiter...");
  await page.goto("https://unstop.com/auth/login?login_as=recruiter", { waitUntil: "networkidle2" });

  // Dismiss cookie banner if present
  try {
    const cookieBtn = await page.waitForSelector('.cookie-banner button, .cookie-consent button, [aria-label*="cookie"], button:has-text("Ok, Continue")', { timeout: 3000 });
    if (cookieBtn) await cookieBtn.click();
  } catch(e) {}

  // Find and click "Login via Password"
  console.log("Looking for 'Login via Password'...");
  const clickedLoginViaPw = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a, span, p, div, button'));
    const link = links.find(el => el.innerText && el.innerText.trim().toLowerCase() === 'login via password');
    if (link) {
      link.click();
      return true;
    }
    return false;
  });
  console.log("Clicked login via password:", clickedLoginViaPw);

  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: '/tmp/after_pw_mode.png' });

  // Type email and password
  console.log("Typing email...");
  await page.type('input[type="text"], input[type="email"]', 'raj.aryan9242@gmail.com', { delay: 50 });

  console.log("Typing password...");
  await page.type('input[type="password"]', 'Aryan2204*', { delay: 50 });

  await page.screenshot({ path: '/tmp/filled_login.png' });

  // Find and click Submit / Login button
  console.log("Clicking Login button...");
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText && (b.innerText.toLowerCase().includes('login') || b.innerText.toLowerCase().includes('sign in')));
    if (btn) btn.click();
  });

  console.log("Waiting for navigation / auth completion...");
  await new Promise(r => setTimeout(r, 6000));

  console.log("Post-login URL:", page.url());
  await page.screenshot({ path: '/tmp/post_login.png' });

  // Save cookies and localStorage
  const cookies = await page.cookies();
  const storage = await page.evaluate(() => Object.assign({}, window.localStorage));
  console.log("Post-login cookies count:", cookies.length);
  console.log("Post-login localStorage keys:", Object.keys(storage));

  await browser.close();
}

testPasswordLogin().catch(console.error);
