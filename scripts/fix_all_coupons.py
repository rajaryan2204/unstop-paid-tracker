import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests
import json
import copy
import time
from scripts.fetch_registrations import login_to_unstop, get_headers

def main():
    print("=" * 60)
    print("UNSTOP COUPON BATCH REPAIR & WHITESPACE CLEANER")
    print("=" * 60)
    session = requests.Session()
    tok, cks = login_to_unstop("raj.aryan9242@gmail.com", "Aryan2204*", session)
    if not tok:
        print("❌ Login failed")
        return
    headers = get_headers(tok, cks)

    with open("data/summary.json") as f:
        summary = json.load(f)

    events = summary.get("events_list", [])
    print(f"Total events to process: {len(events)}\n")

    fixed_events = []
    already_clean_events = []
    skipped_events = []

    for idx, e in enumerate(events, 1):
        eid = e["id"]
        title = e["title"]
        url = f"https://unstop.com/api/competition/{eid}/edit"
        try:
            r = session.get(url, headers=headers, timeout=20)
            if r.status_code != 200:
                print(f"[{idx}/{len(events)}] ⚠️ {eid} - {title[:30]}: HTTP {r.status_code}")
                skipped_events.append({"id": eid, "title": title, "reason": f"HTTP {r.status_code}"})
                continue

            opp = r.json().get("data", {})
            ps = copy.deepcopy(opp.get("payment_services", []))
            regnReq = opp.get("regnRequirements", {})

            if not ps:
                skipped_events.append({"id": eid, "title": title, "reason": "No payment services"})
                continue

            needs_update = False
            changes = []

            for ticket in ps:
                for c in ticket.get("coupons", []):
                    code = c.get("coupon_code", "")
                    if not code:
                        continue
                    
                    cleaned_code = code.strip()
                    # Fix specific typo
                    if cleaned_code == "SLITE":
                        cleaned_code = "SLIET"

                    if cleaned_code != code:
                        needs_update = True
                        changes.append({
                            "ticket_id": ticket["id"],
                            "ticket_title": ticket.get("title", ""),
                            "old_code": code,
                            "new_code": cleaned_code
                        })
                        c["coupon_code"] = cleaned_code

            if needs_update:
                print(f"[{idx}/{len(events)}] 🔧 Fixing Event {eid} - {title[:30]}...")
                for ch in changes:
                    print(f"     Ticket {ch['ticket_id']} ({ch['ticket_title']}): {repr(ch['old_code'])} -> {repr(ch['new_code'])}")

                update_payload = {
                    "id": eid,
                    "currentStep": "payment",
                    "payment_services": ps,
                    "regnRequirements": regnReq
                }

                update_url = f"https://unstop.com/api/listing/job-internship/update/{eid}"
                resp = session.post(update_url, json=update_payload, headers=headers, timeout=20)
                if resp.status_code == 200 and resp.json().get("status") == "success":
                    print(f"     ✅ Successfully updated on Unstop (200 OK)")
                    fixed_events.append({
                        "id": eid,
                        "title": title,
                        "changes": changes,
                        "status": "SUCCESS"
                    })
                else:
                    print(f"     ❌ Failed update: HTTP {resp.status_code} - {resp.text[:200]}")
                    fixed_events.append({
                        "id": eid,
                        "title": title,
                        "changes": changes,
                        "status": f"FAILED: {resp.status_code}"
                    })
            else:
                already_clean_events.append({"id": eid, "title": title})

        except Exception as ex:
            print(f"[{idx}/{len(events)}] ❌ Exception on {eid}: {ex}")
            skipped_events.append({"id": eid, "title": title, "reason": str(ex)})

        time.sleep(0.15)

    print("\n" + "=" * 60)
    print("BATCH FIX SUMMARY")
    print("=" * 60)
    print(f"Events Updated & Fixed: {len(fixed_events)}")
    print(f"Events Already Clean: {len(already_clean_events)}")
    print(f"Events Skipped: {len(skipped_events)}")

    report = {
        "fixed_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "fixed_events": fixed_events,
        "already_clean_count": len(already_clean_events),
        "skipped_count": len(skipped_events)
    }

    with open("data/coupon_fix_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print("\nFull report written to data/coupon_fix_report.json")

if __name__ == "__main__":
    main()
