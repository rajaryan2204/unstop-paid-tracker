import requests, re, os
from concurrent.futures import ThreadPoolExecutor, as_completed

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

with open("/tmp/unstop_main.js") as f:
    text = f.read()

chunks = list(set(re.findall(r"chunk-[A-Z0-9]+\.js", text)))
print(f"Total chunks to scan: {len(chunks)}")

targets = ["Percentage off", "Limit coupon use", "Delete Coupon", "Edit Coupon", "coupon_code"]

def check_chunk(c):
    url = f"https://unstop.com/{c}"
    try:
        r = requests.get(url, headers=headers, timeout=8)
        if r.status_code == 200:
            found = []
            for t in targets:
                if t.lower() in r.text.lower():
                    found.append(t)
            if found:
                with open(f"/tmp/found_{c}", "w") as out:
                    out.write(r.text)
                return (c, found)
    except Exception:
        pass
    return None

results = []
with ThreadPoolExecutor(max_workers=25) as executor:
    futures = {executor.submit(check_chunk, c): c for c in chunks}
    for future in as_completed(futures):
        res = future.result()
        if res:
            print(f"🎯 FOUND in {res[0]}: {res[1]}")
            results.append(res)

print("Scan complete! Found in:", len(results), "chunks.")
