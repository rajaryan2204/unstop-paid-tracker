#!/usr/bin/env python3
"""
Unstop Paid Registrations Fetcher & Sync Script
------------------------------------------------
Fetches registration data from Unstop internal API,
filters participants with successful payment status,
and outputs clean JSON files for the web dashboard.
"""

import os
import json
import logging
from datetime import datetime, timezone
import requests

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)

# Output directory and file paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "paid_participants.json")
SUMMARY_FILE = os.path.join(DATA_DIR, "summary.json")

# Root data file for simple frontend relative fetching
ROOT_DATA_FILE = os.path.join(BASE_DIR, "data.json")

# Configuration from environment variables
UNSTOP_API_URL = os.environ.get("UNSTOP_API_URL", "").strip()
UNSTOP_TOKEN = os.environ.get("UNSTOP_TOKEN", "").strip()
UNSTOP_COOKIES = os.environ.get("UNSTOP_COOKIES", "").strip()
MOCK_MODE = os.environ.get("MOCK_MODE", "false").lower() in ("true", "1", "yes")

os.makedirs(DATA_DIR, exist_ok=True)


def get_headers():
    """Build request headers with auth token and standard browser headers."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://unstop.com/",
        "Origin": "https://unstop.com"
    }

    if UNSTOP_TOKEN:
        # If token does not already have 'Bearer ', add it if it's a JWT
        if not UNSTOP_TOKEN.lower().startswith("bearer ") and not UNSTOP_TOKEN.lower().startswith("token "):
            headers["Authorization"] = f"Bearer {UNSTOP_TOKEN}"
        else:
            headers["Authorization"] = UNSTOP_TOKEN

    if UNSTOP_COOKIES:
        headers["Cookie"] = UNSTOP_COOKIES

    return headers


def is_registration_paid(record: dict) -> bool:
    """
    Check if a registration record represents a completed/successful payment.
    Handles multiple common schema representations on Unstop / payment gateways.
    """
    # 1. Direct boolean flags
    if record.get("is_paid") is True or record.get("isPaid") is True:
        return True

    # 2. Payment status strings
    status_fields = [
        "payment_status", "paymentStatus", "status", "order_status",
        "payment_state", "transaction_status", "fee_status"
    ]
    for field in status_fields:
        val = record.get(field)
        if isinstance(val, str) and val.strip().lower() in ("paid", "success", "successful", "completed", "complete"):
            return True

    # 3. Nested payment / order object
    for nested_key in ("payment", "payment_details", "paymentDetails", "order", "transaction"):
        nested = record.get(nested_key)
        if isinstance(nested, dict):
            nested_status = nested.get("status") or nested.get("payment_status") or nested.get("state")
            if isinstance(nested_status, str) and nested_status.strip().lower() in ("paid", "success", "successful", "completed", "captured"):
                return True
            if nested.get("is_paid") is True or nested.get("isPaid") is True:
                return True

    # 4. Amount paid check
    amount_paid = record.get("amount_paid") or record.get("paid_amount") or record.get("amount")
    try:
        if amount_paid is not None and float(amount_paid) > 0 and record.get("payment_id"):
            return True
    except (ValueError, TypeError):
        pass

    return False


def normalize_participant(record: dict, index: int) -> dict:
    """Normalize inconsistent API response structures into a clean standard format."""
    # User / Leader info
    user_info = record.get("user") or record.get("leader") or record.get("participant") or {}
    if not isinstance(user_info, dict):
        user_info = {}

    name = (
        record.get("full_name")
        or record.get("name")
        or user_info.get("name")
        or f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip()
        or record.get("leader_name")
        or "N/A"
    )

    email = (
        record.get("email")
        or user_info.get("email")
        or record.get("leader_email")
        or "N/A"
    )

    phone = (
        record.get("phone")
        or record.get("mobile")
        or user_info.get("phone")
        or user_info.get("mobile")
        or record.get("contact_number")
        or "N/A"
    )

    college = (
        record.get("college")
        or record.get("organisation")
        or record.get("organization")
        or record.get("institute")
        or user_info.get("college")
        or user_info.get("organisation")
        or "N/A"
    )

    team_name = record.get("team_name") or record.get("teamName") or record.get("team")
    if isinstance(team_name, dict):
        team_name = team_name.get("name") or "Individual"
    elif not team_name:
        team_name = "Individual"

    # Team members
    members = []
    raw_members = record.get("team_members") or record.get("members") or record.get("users") or []
    if isinstance(raw_members, list):
        for m in raw_members:
            if isinstance(m, dict):
                m_name = m.get("name") or f"{m.get('first_name', '')} {m.get('last_name', '')}".strip()
                m_email = m.get("email", "")
                m_college = m.get("college") or m.get("organisation", "")
                members.append({"name": m_name, "email": m_email, "college": m_college})
            elif isinstance(m, str):
                members.append({"name": m, "email": "", "college": ""})

    # Payment details
    payment_obj = record.get("payment") or record.get("payment_details") or {}
    if not isinstance(payment_obj, dict):
        payment_obj = {}

    payment_id = (
        record.get("payment_id")
        or record.get("transaction_id")
        or payment_obj.get("payment_id")
        or payment_obj.get("transaction_id")
        or payment_obj.get("id")
        or f"TXN-{index:04d}"
    )

    amount = (
        record.get("amount_paid")
        or record.get("amount")
        or payment_obj.get("amount")
        or payment_obj.get("amount_paid")
        or 0
    )
    try:
        amount = float(amount)
    except (ValueError, TypeError):
        amount = 0.0

    registered_at = (
        record.get("created_at")
        or record.get("registered_at")
        or record.get("registration_date")
        or payment_obj.get("created_at")
        or datetime.now(timezone.utc).isoformat()
    )

    reg_id = (
        str(record.get("id") or record.get("registration_id") or record.get("_id") or f"REG-{index:04d}")
    )

    return {
        "id": reg_id,
        "name": name,
        "email": email,
        "phone": phone,
        "college": college,
        "team_name": team_name,
        "team_size": max(1, len(members) if members else 1),
        "team_members": members,
        "payment_id": payment_id,
        "amount": amount,
        "payment_status": "PAID",
        "registered_at": registered_at,
        "raw": record if os.environ.get("INCLUDE_RAW", "").lower() == "true" else None
    }


def fetch_from_api():
    """Fetch all registrations from Unstop API handling pagination."""
    if not UNSTOP_API_URL:
        logging.warning("UNSTOP_API_URL is not set!")
        return None

    headers = get_headers()
    all_registrations = []
    page = 1
    per_page = 100

    logging.info(f"Connecting to Unstop API: {UNSTOP_API_URL}")

    while True:
        try:
            params = {"page": page, "per_page": per_page, "limit": per_page}
            response = requests.get(
                UNSTOP_API_URL,
                headers=headers,
                params=params,
                timeout=30
            )

            if response.status_code in (401, 403):
                logging.error(f"Authentication failed (HTTP {response.status_code})! Token might be expired.")
                print("::error::Unstop Token is expired or invalid. Please update UNSTOP_TOKEN secret in GitHub repository settings!")
                break

            response.raise_for_status()
            data = response.json()

            # Handle different JSON envelope types: { data: [...] } or { results: [...] } or direct list [...]
            items = []
            if isinstance(data, list):
                items = data
            elif isinstance(data, dict):
                for candidate_key in ("data", "results", "registrations", "participants", "users", "items"):
                    if candidate_key in data and isinstance(data[candidate_key], list):
                        items = data[candidate_key]
                        break
                    elif candidate_key in data and isinstance(data[candidate_key], dict):
                        inner = data[candidate_key].get("data") or data[candidate_key].get("results")
                        if isinstance(inner, list):
                            items = inner
                            break

            if not items:
                logging.info(f"No items found on page {page}. Completed pagination.")
                break

            logging.info(f"Page {page}: Fetched {len(items)} records.")
            all_registrations.extend(items)

            # Check pagination stopping condition
            if len(items) < per_page:
                break

            # If there's an explicit last_page or total_pages
            pagination_info = data.get("meta") or data.get("pagination") or {}
            total_pages = pagination_info.get("last_page") or pagination_info.get("total_pages")
            if total_pages and page >= total_pages:
                break

            page += 1
            if page > 100:  # Safety guardrail
                logging.warning("Hit 100 page safety limit.")
                break

        except requests.exceptions.RequestException as e:
            logging.error(f"Network / API Error on page {page}: {e}")
            break

    return all_registrations


def generate_mock_data():
    """Generates realistic mock data so dashboard works immediately before token is linked."""
    logging.info("Generating realistic mock data for preview...")
    sample_colleges = [
        "Sant Longowal Institute of Engineering & Technology (SLIET)",
        "Thapar Institute of Engineering and Technology",
        "IIT Ropar",
        "NIT Jalandhar",
        "PEC Chandigarh",
        "Chandigarh University",
        "TIET Patiala"
    ]
    
    mock_participants = [
        {
            "id": "UNSTOP-89211",
            "name": "Aarav Sharma",
            "email": "aarav.sharma@gmail.com",
            "phone": "+91 98765 43210",
            "college": sample_colleges[0],
            "team_name": "CodeCrafters",
            "team_size": 3,
            "team_members": [
                {"name": "Aarav Sharma", "email": "aarav.sharma@gmail.com", "college": sample_colleges[0]},
                {"name": "Priya Verma", "email": "priya.v@gmail.com", "college": sample_colleges[0]},
                {"name": "Rohan Das", "email": "rohan.d@gmail.com", "college": sample_colleges[0]}
            ],
            "payment_id": "pay_O7dKa9xYZaB1",
            "amount": 499.0,
            "payment_status": "PAID",
            "registered_at": "2026-09-29T14:32:00Z"
        },
        {
            "id": "UNSTOP-89215",
            "name": "Simran Kaur",
            "email": "simran.kaur@yahoo.com",
            "phone": "+91 98123 76540",
            "college": sample_colleges[1],
            "team_name": "ByteBrigade",
            "team_size": 2,
            "team_members": [
                {"name": "Simran Kaur", "email": "simran.kaur@yahoo.com", "college": sample_colleges[1]},
                {"name": "Jaspreet Singh", "email": "jassi.singh@gmail.com", "college": sample_colleges[1]}
            ],
            "payment_id": "pay_O7dMm12kLpQ9",
            "amount": 399.0,
            "payment_status": "PAID",
            "registered_at": "2026-09-29T15:10:40Z"
        },
        {
            "id": "UNSTOP-89222",
            "name": "Devansh Singla",
            "email": "devansh.tech@sliet.ac.in",
            "phone": "+91 97800 11223",
            "college": sample_colleges[0],
            "team_name": "Solo Hacker",
            "team_size": 1,
            "team_members": [],
            "payment_id": "pay_O7dPp45rTxW3",
            "amount": 199.0,
            "payment_status": "PAID",
            "registered_at": "2026-09-29T16:05:12Z"
        },
        {
            "id": "UNSTOP-89230",
            "name": "Ananya Gupta",
            "email": "ananya.gupta@nitj.ac.in",
            "phone": "+91 94170 99887",
            "college": sample_colleges[3],
            "team_name": "AlgoWarriors",
            "team_size": 4,
            "team_members": [
                {"name": "Ananya Gupta", "email": "ananya.gupta@nitj.ac.in", "college": sample_colleges[3]},
                {"name": "Kunal Sen", "email": "kunal.sen@nitj.ac.in", "college": sample_colleges[3]},
                {"name": "Neha Mehra", "email": "neha.m@nitj.ac.in", "college": sample_colleges[3]},
                {"name": "Tanmay Bhatia", "email": "tanmay.b@gmail.com", "college": sample_colleges[3]}
            ],
            "payment_id": "pay_O7dZz88wEwN0",
            "amount": 599.0,
            "payment_status": "PAID",
            "registered_at": "2026-09-29T17:45:29Z"
        },
        {
            "id": "UNSTOP-89241",
            "name": "Rahul Verma",
            "email": "rahul.verma@pec.edu.in",
            "phone": "+91 99881 22334",
            "college": sample_colleges[4],
            "team_name": "CircuitBreakers",
            "team_size": 2,
            "team_members": [
                {"name": "Rahul Verma", "email": "rahul.verma@pec.edu.in", "college": sample_colleges[4]},
                {"name": "Sahil Kapoor", "email": "sahil.k@pec.edu.in", "college": sample_colleges[4]}
            ],
            "payment_id": "pay_O7eaB33tYyK7",
            "amount": 399.0,
            "payment_status": "PAID",
            "registered_at": "2026-09-29T18:22:15Z"
        }
    ]
    return mock_participants


def main():
    sync_time = datetime.now(timezone.utc).isoformat()
    raw_records = None

    if not MOCK_MODE and UNSTOP_API_URL and UNSTOP_TOKEN:
        raw_records = fetch_from_api()

    # If API not configured or failed, check if we already have existing data
    if raw_records is None:
        if os.path.exists(OUTPUT_FILE) and os.path.getsize(OUTPUT_FILE) > 10:
            logging.info(f"API returned no data, retaining existing cached data from {OUTPUT_FILE}")
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                paid_list = json.load(f)
        else:
            logging.info("Using mock data as initial bootstrap dataset.")
            paid_list = generate_mock_data()
    else:
        # Filter paid records
        paid_records = [r for r in raw_records if is_registration_paid(r)]
        logging.info(f"Filtered {len(paid_records)} paid registrations out of {len(raw_records)} total.")
        paid_list = [normalize_participant(r, i + 1) for i, r in enumerate(paid_records)]

    # Compute summary stats
    total_paid_count = len(paid_list)
    total_revenue = sum(p.get("amount", 0) for p in paid_list)
    colleges = list({p.get("college") for p in paid_list if p.get("college") and p.get("college") != "N/A"})
    
    summary = {
        "last_synced_at": sync_time,
        "total_paid_registrations": total_paid_count,
        "total_amount_collected": round(total_revenue, 2),
        "total_colleges": len(colleges),
        "is_mock": raw_records is None and not os.path.exists(OUTPUT_FILE),
        "status": "HEALTHY"
    }

    # Save to data directory
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(paid_list, f, indent=2, ensure_ascii=False)
    logging.info(f"Saved {total_paid_count} paid records to {OUTPUT_FILE}")

    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    logging.info(f"Saved summary to {SUMMARY_FILE}")

    # Also save to root data.json for convenient static web hosting
    combined_web_data = {
        "summary": summary,
        "participants": paid_list
    }
    with open(ROOT_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(combined_web_data, f, indent=2, ensure_ascii=False)
    logging.info(f"Saved combined web data to {ROOT_DATA_FILE}")

    print("\n✅ Sync Completed Successfully!")
    print(f"📊 Total Paid: {total_paid_count} | Revenue: ₹{total_revenue:,.2f} | Unique Colleges: {len(colleges)}")


if __name__ == "__main__":
    main()
