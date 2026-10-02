import requests
import re
import os
from concurrent.futures import ThreadPoolExecutor

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

seen = set()
to_scan = set()

# Seed with main.js
with open("/tmp/unstop_main.js") as f:
    text = f.read()

chunks = set(re.findall(r"chunk-[A-Z0-9]+\.js", text))
to_scan.update(chunks)
print(f"Initial chunks from main: {len(to_scan)}")

all_found_chunks = set(to_scan)

targets = ["edit coupon", "delete coupon", "discount type", "schedule time", "limit coupon"]

found_targets = []

def download_and_check(c):
    url = f"https://unstop.com/{c}"
    try:
        r = requests.get(url, headers=headers, timeout=6)
        if r.status_code == 200:
            content = r.text
            # check for new chunks
            new_chunks = set(re.findall(r"chunk-[A-Z0-9]+\.js", content))
            
            # check targets
            lower = content.lower()
            hit = [t for t in targets if t in lower]
            if hit:
                print(f"🎯🎯🎯 HIT IN {c}: {hit}")
                found_targets.append((c, hit))
                with open(f"/tmp/HIT_{c}", "w") as out:
                    out.write(content)
            return (c, new_chunks)
    except Exception:
        pass
    return (c, set())

# Traverse depth 1
with ThreadPoolExecutor(max_workers=30) as ex:
    results = list(ex.map(download_and_check, list(to_scan)))

sub_chunks = set()
for c, news in results:
    seen.add(c)
    sub_chunks.update(news - seen)

print(f"Depth 1 complete. New sub-chunks discovered: {len(sub_chunks)}")
if sub_chunks:
    with ThreadPoolExecutor(max_workers=30) as ex:
        results2 = list(ex.map(download_and_check, list(sub_chunks)))
    print("Depth 2 complete.")

print(f"All hits found: {found_targets}")
