const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');

async function getAuth() {
  console.log("Getting fresh Unstop token and encData via python...");
  const cmd = `python3 -c '
import sys, os, json
sys.path.append(os.path.dirname(os.path.abspath(".")))
import requests
import urllib.parse

csrf_url = "https://unstop.com/api/micro/oauth/v2/generate/csrf-cookie"
login_headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://unstop.com",
    "Referer": "https://unstop.com/auth/login"
}
s = requests.Session()
s.get(csrf_url, headers=login_headers)
xsrf = s.cookies.get("XSRF-TOKEN")
if xsrf:
    login_headers["X-XSRF-TOKEN"] = urllib.parse.unquote(xsrf)

login_url = "https://unstop.com/api/micro/oauth/v2/user/login"
payload = {
    "grant_type": "password",
    "username": "raj.aryan9242@gmail.com",
    "email": "raj.aryan9242@gmail.com",
    "password": "Aryan2204*",
    "scope": "*",
    "network": "",
    "access_token": "",
    "e": True
}
r = s.post(login_url, json=payload, headers=login_headers)
data = r.json()
cookies_dict = s.cookies.get_dict()
cookies_dict["access_token"] = s.cookies.get("access_token", "")

print(json.dumps({
    "encData": data.get("encData", ""),
    "token": s.cookies.get("access_token", ""),
    "cookies": cookies_dict
}))
'`;
  const output = execSync(cmd, { encoding: 'utf-8' });
  const lines = output.trim().split('\n');
  return JSON.parse(lines[lines.length - 1]);
}

async function testAuthNavigation() {
  const auth = await getAuth();
  console.log("Got auth! encData len:", auth.encData ? auth.encData.length : 0);

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1400,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  // Set cookies
  const puppeteerCookies = Object.entries(auth.cookies).map(([name, value]) => ({
    name,
    value: String(value),
    domain: '.unstop.com',
    path: '/'
  }));
  await page.setCookie(...puppeteerCookies);

  // Navigate to root to initialize localStorage
  await page.goto('https://unstop.com', { waitUntil: 'domcontentloaded' });

  // Set localStorage
  await page.evaluate((encData, token) => {
    localStorage.setItem('currentUser', encData);
    localStorage.setItem('accessToken', encData);
    localStorage.setItem('token', token);
  }, auth.encData, auth.token);

  // Monitor network requests
  page.on('request', req => {
    const url = req.url();
    if (url.includes('/api/')) {
      console.log(`[REQ] ${req.method()} ${url}`);
    }
  });

  page.on('response', async res => {
    const url = res.url();
    if (url.includes('/api/') && (url.includes('opportunity') || url.includes('payment') || url.includes('coupon'))) {
      try {
        const text = await res.text();
        console.log(`🔥 [RES] ${res.status()} ${url}`);
        console.log(`   Sample: ${text.substring(0, 300)}`);
      } catch(e) {}
    }
  });

  console.log("Now navigating to https://unstop.com/organiser-panel/opportunity/1744160/edit/payment...");
  await page.goto('https://unstop.com/organiser-panel/opportunity/1744160/edit/payment', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  console.log("Navigated! Current URL:", page.url());
  await new Promise(r => setTimeout(r, 5000));

  await page.screenshot({ path: '/tmp/auth_success_payment.png', fullPage: true });
  console.log("Saved screenshot to /tmp/auth_success_payment.png");

  await browser.close();
}

testAuthNavigation().catch(console.error);
