import requests
import re
import json

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Referer": "https://unstop.com/organiser-panel/opportunity/1744160/edit/payment"
}

chunks = ["chunk-NPWTDWEP.js", "chunk-UDFXDP66.js", "chunk-CGCHBK7M.js"]
for c in chunks:
    url = f"https://unstop.com/{c}"
    r = requests.get(url, headers=headers)
    print(f"{c}: status={r.status_code}, len={len(r.text)}")
    if r.status_code == 200:
        with open(f"/tmp/{c}", "w") as f:
            f.write(r.text)
        # Search for routes inside this chunk
        sub_routes = re.findall(r"path:\"([^\"]+)\",loadChildren:\(\)=>import\(\"([^\"]+)\"\)", r.text)
        if sub_routes:
            print(f"  Sub routes in {c}:", sub_routes)
        # Search for API endpoints
        apis = set(re.findall(r'["\'](/api/[a-zA-Z0-9_\-\?=/&%]+)["\']', r.text))
        coupon_apis = [a for a in apis if any(k in a.lower() for k in ["coupon", "payment", "opportunity"])]
        print(f"  Coupon/Payment APIs in {c}:", coupon_apis)
