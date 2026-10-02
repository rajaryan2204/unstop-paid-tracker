import requests, re

headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "Accept": "*/*",
}

with open("/tmp/unstop_main.js") as f:
    text = f.read()

chunks = list(set(re.findall(r"chunk-[A-Z0-9]+\.js", text)))
print(f"Total chunks: {len(chunks)}")

targets = ["Percentage off", "Limit coupon use", "Delete Coupon", "Edit Coupon"]

for i, c in enumerate(chunks):
    try:
        r = requests.get(f"https://unstop.com/{c}", headers=headers, timeout=5)
        if r.status_code == 200:
            for t in targets:
                if t.lower() in r.text.lower():
                    print(f"🎯 FOUND '{t}' in {c} (chunk {i+1}/{len(chunks)})")
                    with open(f"/tmp/found_{c}", "w") as out:
                        out.write(r.text)
    except Exception as e:
        pass
