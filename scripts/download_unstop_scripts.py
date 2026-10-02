import requests
import re
import os

session = requests.Session()
# Fetch the page
r = session.get("https://unstop.com/organiser-panel/opportunity/1744160/edit/payment")
scripts = re.findall(r'src=["\']([^"\']+\.js)["\']', r.text)
print("Scripts found:", scripts)

for s in scripts:
    url = s if s.startswith("http") else f"https://unstop.com/{s.lstrip('/')}"
    fn = os.path.basename(s)
    print(f"Downloading {fn}...")
    res = session.get(url)
    with open(f"/tmp/{fn}", "w", encoding="utf-8") as f:
        f.write(res.text)
    print(f"Saved {fn}, size: {len(res.text)}")
