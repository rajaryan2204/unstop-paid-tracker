import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests
import json
import time
from scripts.fetch_registrations import login_to_unstop, get_headers

def main():
    session = requests.Session()
    tok, cks = login_to_unstop("raj.aryan9242@gmail.com", "Aryan2204*", session)
    if not tok:
        print("Login failed")
        return
    headers = get_headers(tok, cks)

    with open("data/summary.json") as f:
        summary = json.load(f)

    events = summary.get("events_list", [])
    print(f"Total events in festival: {len(events)}")

    coupon_audit = []
    
    for idx, e in enumerate(events, 1):
        eid = e["id"]
        title = e["title"]
        url = f"https://unstop.com/api/competition/{eid}/edit"
        try:
            r = session.get(url, headers=headers, timeout=15)
            if r.status_code == 200:
                opp = r.json().get("data", {})
                ps = opp.get("payment_services", [])
                found_coupons = []
                for ticket in ps:
                    for c in ticket.get("coupons", []):
                        found_coupons.append({
                            "ticket_id": ticket.get("id"),
                            "ticket_title": ticket.get("title"),
                            "coupon_id": c.get("id"),
                            "coupon_code": c.get("coupon_code"),
                            "coupon_value": c.get("coupon_value"),
                            "coupon_type": c.get("coupon_type"),
                            "has_whitespace": c.get("coupon_code") != c.get("coupon_code", "").strip() if c.get("coupon_code") else False
                        })
                
                print(f"[{idx}/{len(events)}] {eid} - {title[:30]}: {len(ps)} tickets, {len(found_coupons)} coupons")
                for fc in found_coupons:
                    code_repr = repr(fc["coupon_code"])
                    ws_flag = "⚠️ WHITESPACE DETECTED!" if fc["has_whitespace"] else "✅ Clean"
                    print(f"     -> Ticket {fc['ticket_id']} ({fc['ticket_title']}): Code={code_repr} {ws_flag}")

                coupon_audit.append({
                    "event_id": eid,
                    "title": title,
                    "payment_services": ps,
                    "coupons": found_coupons
                })
            else:
                print(f"[{idx}/{len(events)}] {eid} - {title[:30]}: HTTP {r.status_code}")
        except Exception as ex:
            print(f"[{idx}/{len(events)}] {eid} - {title[:30]}: Exception {ex}")

        time.sleep(0.1)

    with open("data/coupon_audit.json", "w") as f:
        json.dump(coupon_audit, f, indent=2)
    print("\nSaved full audit to data/coupon_audit.json")

if __name__ == "__main__":
    main()
