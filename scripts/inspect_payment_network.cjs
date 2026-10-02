const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const fs = require('fs');

async function getAuth() {
  console.log("Getting fresh Unstop token and cookies via python...");
  const cmd = `python3 -c '
import sys, os, json
sys.path.append(os.path.dirname(os.path.abspath(".")))
from scripts.fetch_registrations import login_to_unstop
import requests
session = requests.Session()
tok, cks = login_to_unstop("raj.aryan9242@gmail.com", "Aryan2204*", session)
cookies_dict = session.cookies.get_dict()
cookies_dict["access_token"] = tok
print(json.dumps(cookies_dict))
'`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  const lines = output.trim().split('\n');
  const jsonStr = lines[lines.length - 1];
  return JSON.parse(jsonStr);
}

async function run() {
  const cookiesDict = await getAuth();
  console.log("Acquired cookies:", Object.keys(cookiesDict));

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Map cookies for puppeteer
  const puppeteerCookies = Object.entries(cookiesDict).map(([name, value]) => ({
    name,
    value: String(value),
    domain: '.unstop.com',
    path: '/'
  }));

  await page.setCookie(...puppeteerCookies);

  // Monitor network requests
  const apiCalls = [];
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/')) {
      apiCalls.push({ method: req.method(), url, postData: req.postData() });
      console.log(`[REQ] ${req.method()} ${url}`);
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/') && (url.includes('coupon') || url.includes('payment') || url.includes('opportunity'))) {
      try {
        const text = await res.text();
        console.log(`[RES] ${res.status()} ${url} -> Len: ${text.length}`);
        if (text.length < 2000) {
          console.log(`      Body: ${text}`);
        } else {
          console.log(`      Body (first 500): ${text.substring(0, 500)}`);
        }
      } catch (e) {}
    }
  });

  console.log("Navigating to organiser opportunity 1744160 edit payment...");
  await page.goto('https://unstop.com/organiser-panel/opportunity/1744160/edit/payment', {
    waitUntil: 'networkidle2',
    timeout: 45000
  });

  console.log("Current URL:", page.url());
  await new Promise(r => setTimeout(r, 4000));

  await page.screenshot({ path: '/tmp/unstop_edit_payment.png', fullPage: true });
  console.log("Saved screenshot to /tmp/unstop_edit_payment.png");

  fs.writeFileSync('/tmp/unstop_api_calls.json', JSON.stringify(apiCalls, null, 2));

  await browser.close();
}

run().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
