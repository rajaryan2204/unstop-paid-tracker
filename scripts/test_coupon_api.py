import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests
import json
from scripts.fetch_registrations import login_to_unstop, get_headers

def main():
    session = requests.Session()
    token, cookies = login_to_unstop("raj.aryan9242@gmail.com", "Aryan2204*", session)
    if not token:
        print("Login failed")
        return
    headers = get_headers(token, cookies)

    eid = 1744160
    r = session.get(f"https://unstop.com/api/opportunity/{eid}", headers=headers)
    if r.status_code == 200:
        opp_data = r.json().get("data", {})
        services = opp_data.get("payment_services", [])
        print("Payment services count:", len(services))
        for s in services:
            print(json.dumps(s, indent=2))

if __name__ == "__main__":
    main()
