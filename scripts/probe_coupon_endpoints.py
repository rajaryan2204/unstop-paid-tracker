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

    opp_id = 1744160
    service_id = 732007

    test_endpoints = [
        f"https://unstop.com/api/coupons?payment_service_id={service_id}",
        f"https://unstop.com/api/coupons?service_id={service_id}",
        f"https://unstop.com/api/coupons?entity_id={opp_id}",
        f"https://unstop.com/api/coupons?entity_id={service_id}",
        f"https://unstop.com/api/coupons?entity_id={opp_id}&entity_type=opportunity",
        f"https://unstop.com/api/coupons?entity_id={service_id}&entity_type=payment_service",
        f"https://unstop.com/api/payment-service/{service_id}",
        f"https://unstop.com/api/payment-services/{service_id}",
        f"https://unstop.com/api/payment-service/{service_id}/coupon",
        f"https://unstop.com/api/payment-service/{service_id}/coupons",
        f"https://unstop.com/api/opportunity/{opp_id}/payment-service",
        f"https://unstop.com/api/opportunity/{opp_id}/payment-services",
        f"https://unstop.com/api/organiser/opportunity/{opp_id}/payment",
        f"https://unstop.com/api/v1/opportunity/{opp_id}/payment-services",
        f"https://unstop.com/api/coupon/opportunity/{opp_id}",
        f"https://unstop.com/api/coupon/payment-service/{service_id}",
        f"https://unstop.com/api/coupons/opportunity/{opp_id}",
        f"https://unstop.com/api/coupons/payment-service/{service_id}",
        f"https://unstop.com/api/get-coupons?opportunity_id={opp_id}",
        f"https://unstop.com/api/get-coupons?payment_service_id={service_id}",
        f"https://unstop.com/api/opportunity/{opp_id}/edit/payment",
    ]

    for u in test_endpoints:
        r = session.get(u, headers=headers)
        if r.status_code != 404:
            print(f"👉 GET {u} -> Status {r.status_code}")
            try:
                data = r.json()
                print("   Data:", json.dumps(data)[:300])
            except:
                print("   Text:", r.text[:200])

if __name__ == "__main__":
    main()
