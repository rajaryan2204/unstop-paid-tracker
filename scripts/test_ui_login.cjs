const puppeteer = require('puppeteer-core');

async function testLoginUI() {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  console.log("Navigating to https://unstop.com/auth/login...");
  await page.goto('https://unstop.com/auth/login', { waitUntil: 'networkidle2' });

  // Find candidate or employer cards
  const textContent = await page.evaluate(() => document.body.innerText);
  console.log("Page has text:", textContent.substring(0, 200).replace(/\n/g, ' '));

  // Click on "I'm an Employer"
  console.log("Clicking I'm an Employer...");
  const clicked = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll('div, p, span, h3, h4'));
    const emp = elements.find(el => el.innerText && el.innerText.includes("I'm an Employer"));
    if (emp) {
      emp.click();
      return true;
    }
    return false;
  });
  console.log("Clicked employer:", clicked);

  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: '/tmp/after_employer_click.png' });
  console.log("Screenshot saved to /tmp/after_employer_click.png");

  // Check inputs on page
  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('input')).map(i => ({
      name: i.name,
      type: i.type,
      id: i.id,
      placeholder: i.placeholder
    }));
  });
  console.log("Inputs found:", inputs);

  await browser.close();
}

testLoginUI().catch(console.error);
