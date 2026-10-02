import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests
import json
import copy
from scripts.fetch_registrations import login_to_unstop, get_headers

def main():
    session = requests.Session()
    tok, cks = login_to_unstop("raj.aryan9242@gmail.com", "Aryan2204*", session)
    if not tok:
        print("Login failed")
        return
    headers = get_headers(tok, cks)

    eid = 1744774 # Food Forge
    print(f"Fetching current details for Event {eid} (Food Forge)...")
    r = session.get(f"https://unstop.com/api/competition/{eid}/edit", headers=headers)
    if r.status_code != 200:
        print("Failed to fetch event:", r.status_code, r.text[:300])
        return

    opp = r.json().get("data", {})
    ps = copy.deepcopy(opp.get("payment_services", []))
    regnReq = opp.get("regnRequirements", {})

    print(f"Original tickets count: {len(ps)}")
    for t in ps:
        for c in t.get("coupons", []):
            print(f"  Ticket {t['id']} Coupon: {repr(c.get('coupon_code'))}")
            # Trim whitespace
            if c.get("coupon_code"):
                c["coupon_code"] = c["coupon_code"].strip()
                print(f"  Trimmed to: {repr(c.get('coupon_code'))}")

    update_payload = {
        "id": eid,
        "currentStep": "payment",
        "payment_services": ps,
        "regnRequirements": regnReq
    }

    update_url = f"https://unstop.com/api/listing/job-internship/update/{eid}"
    print(f"Sending POST to {update_url}...")
    resp = session.post(update_url, json=update_payload, headers=headers)
    print(f"Update response status: {resp.status_code}")
    print("Response body:", resp.text[:500])

    # Re-fetch to verify!
    print("\nRe-fetching event to verify persistence...")
    r_ver = session.get(f"https://unstop.com/api/competition/{eid}/edit", headers=headers)
    if r_ver.status_code == 200:
        opp_ver = r_ver.json().get("data", {})
        for t in opp_ver.get("payment_services", []):
            for c in t.get("coupons", []):
                print(f"  VERIFIED Ticket {t['id']} Coupon: {repr(c.get('coupon_code'))}")

if __name__ == "__main__":
    main()
