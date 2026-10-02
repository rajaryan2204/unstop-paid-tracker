import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests
import json
import re
from scripts.fetch_registrations import login_to_unstop, get_headers

def main():
    session = requests.Session()
    token, cookies = login_to_unstop("raj.aryan9242@gmail.com", "Aryan2204*", session)
    if not token:
        print("Login failed")
        return
    headers = get_headers(token, cookies)

    eid = 1744160
    url = f"https://unstop.com/organiser-panel/opportunity/{eid}/edit/payment"
    r = session.get(url, headers=headers)
    print("Page status:", r.status_code, "HTML len:", len(r.text))

    # Look for all script tags
    scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\']', r.text)
    print("Scripts in page:", scripts)

    # Let us search main-*.js and scripts-*.js
    for s in scripts:
        full_url = s if s.startswith("http") else f"https://unstop.com/{s.lstrip('/')}"
        print(f"Fetching {full_url}...")
        resp = session.get(full_url)
        content = resp.text
        # Search for all endpoints like /api/...
        endpoints = set(re.findall(r'["\'](/api/[a-zA-Z0-9_\-\?=/&%]+)["\']', content))
        coupon_eps = [e for e in endpoints if "coupon" in e.lower() or "payment" in e.lower()]
        print(f"Endpoints in {s}: total={len(endpoints)}, coupon/payment related={coupon_eps}")

        # Also search for lazy chunks
        lazy_chunks = re.findall(r'["\']([a-zA-Z0-9_\-]+\.js)["\']', content)
        chunk_candidates = [c for c in set(lazy_chunks) if "chunk" in c.lower() or "-" in c]
        if chunk_candidates:
            print(f"Found {len(chunk_candidates)} chunk candidates in {s}")
            for c in list(chunk_candidates)[:10]:
                c_url = f"https://unstop.com/{c}"
                try:
                    c_resp = session.get(c_url, timeout=5)
                    if c_resp.status_code == 200 and "coupon" in c_resp.text.lower():
                        print(f"🔥 Found coupon in chunk {c}!")
                        c_eps = set(re.findall(r'["\'](/api/[a-zA-Z0-9_\-\?=/&%]+)["\']', c_resp.text))
                        print("  Endpoints:", [e for e in c_eps if "coupon" in e.lower() or "payment" in e.lower()])
                except Exception:
                    pass

if __name__ == "__main__":
    main()
