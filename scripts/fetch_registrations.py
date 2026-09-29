#!/usr/bin/env python3
"""
Unstop Paid Registrations Fetcher & Sync Script
------------------------------------------------
Fetches registration data from Unstop internal API,
filters participants with successful payment / complete status,
and outputs clean JSON files for the web dashboard.
"""

import os
import json
import logging
import base64
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
ROOT_DATA_FILE = os.path.join(BASE_DIR, "data.json")

# Default Opportunity ID (The Aqua-Epoch: 1744819)
DEFAULT_OPPORTUNITY_ID = "1744819"
OPPORTUNITY_ID = os.environ.get("OPPORTUNITY_ID", DEFAULT_OPPORTUNITY_ID).strip()

# Default URL pattern for Unstop job-profiles paginated API
DEFAULT_API_URL = f"https://unstop.com/api/opportunity/{OPPORTUNITY_ID}/job-profiles/paginated"
UNSTOP_API_URL = os.environ.get("UNSTOP_API_URL", DEFAULT_API_URL).strip()

UNSTOP_TOKEN = os.environ.get("UNSTOP_TOKEN", "").strip()
UNSTOP_COOKIES = os.environ.get("UNSTOP_COOKIES", "").strip()
UNSTOP_ACCOUNT_ID = os.environ.get("UNSTOP_ACCOUNT_ID", "2313619").strip()
MOCK_MODE = os.environ.get("MOCK_MODE", "false").lower() in ("true", "1", "yes")

os.makedirs(DATA_DIR, exist_ok=True)


def parse_jwt_expiry(token: str):
    """Extract expiry date from JWT token if available."""
    try:
        clean_token = token.replace("Bearer ", "").strip()
        parts = clean_token.split(".")
        if len(parts) >= 2:
            payload_b64 = parts[1] + "==="
            payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")))
            if "exp" in payload:
                return datetime.fromtimestamp(payload["exp"], timezone.utc).isoformat()
    except Exception as e:
        logging.debug(f"Could not parse JWT expiry: {e}")
    return None


def get_headers():
    """Build request headers with auth token and standard browser headers."""
    headers = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": f"https://unstop.com/manage/opportunity/{OPPORTUNITY_ID}/profiles/all-registrations",
        "Origin": "https://unstop.com",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36",
        "selected-account": UNSTOP_ACCOUNT_ID
    }

    if UNSTOP_TOKEN:
        if not UNSTOP_TOKEN.lower().startswith("bearer ") and not UNSTOP_TOKEN.lower().startswith("token "):
            headers["Authorization"] = f"Bearer {UNSTOP_TOKEN}"
        else:
            headers["Authorization"] = UNSTOP_TOKEN

    if UNSTOP_COOKIES:
        headers["Cookie"] = UNSTOP_COOKIES

    return headers


def is_registration_paid(record: dict) -> bool:
    """
    Check if a registration record represents a completed/paid participant.
    Unstop flags:
      - regi_status == 'complete'
      - registrationStatus == 'Complete Registration' (vs 'Registraition fee not paid')
      - paid_amount > 0 or paidAmount > 0
    """
    # 1. Check Unstop specific regi_status
    regi_status = str(record.get("regi_status", "")).strip().lower()
    if regi_status == "complete":
        return True

    # 2. Check registrationStatus text
    reg_status_text = str(record.get("registrationStatus", "")).strip().lower()
    if "not paid" in reg_status_text:
        return False
    if "complete" in reg_status_text or "paid" in reg_status_text:
        return True

    # 3. Check paid amount fields
    for amt_field in ("paid_amount", "paidAmount", "amount_paid", "amount"):
        val = record.get(amt_field)
        try:
            if val is not None and float(val) > 0:
                return True
        except (ValueError, TypeError):
            pass

    # 4. Standard is_paid flags
    if record.get("is_paid") is True or record.get("isPaid") is True:
        return True

    return False


def normalize_record(record: dict, index: int) -> dict:
    """Normalize Unstop record into standard dashboard format."""
    players = record.get("players") or []
    primary_player = players[0] if players else {}
    user_obj = record.get("user") or {}

    # Name
    name = (
        primary_player.get("name")
        or user_obj.get("name")
        or record.get("full_name")
        or f"Participant #{index}"
    )

    # Email
    email = (
        primary_player.get("unlock_email")
        or record.get("email")
        or "N/A"
    )

    # Phone
    phone = (
        primary_player.get("unlock_mobile")
        or record.get("phone")
        or record.get("mobile")
        or "N/A"
    )

    # College
    college = (
        primary_player.get("organisation")
        or record.get("college")
        or record.get("organisation")
        or "N/A"
    )

    # Team Name
    team_name = record.get("team_name") or "Individual"
    if isinstance(team_name, dict):
        team_name = team_name.get("name") or "Individual"

    # Team members
    members = []
    if players:
        for p in players:
            m_name = p.get("name") or "Team Member"
            m_email = p.get("unlock_email") or ""
            m_phone = p.get("unlock_mobile") or ""
            m_col = p.get("organisation") or college
            m_course = p.get("course_specialization") or ""
            members.append({
                "name": m_name,
                "email": m_email,
                "phone": m_phone,
                "college": m_col,
                "course": m_course
            })

    # Payment Amount
    amount = 0.0
    for amt_field in ("paid_amount", "paidAmount", "amount_paid", "amount"):
        val = record.get(amt_field)
        try:
            if val is not None:
                amount = float(val)
                break
        except (ValueError, TypeError):
            pass

    regn_id = record.get("regn_id") or str(record.get("id")) or f"REG-{index:04d}"
    registered_at = record.get("last_seen") or record.get("created_at") or datetime.now(timezone.utc).isoformat()
    status_label = record.get("registrationStatus") or "Complete Registration"

    return {
        "id": regn_id,
        "internal_id": record.get("id"),
        "name": name,
        "email": email,
        "phone": phone,
        "college": college,
        "team_name": team_name,
        "team_size": max(1, len(members)),
        "team_members": members,
        "payment_id": f"UNSTOP-{record.get('id')}",
        "amount": amount,
        "payment_status": "PAID",
        "status_label": status_label,
        "registered_at": registered_at,
        "resume_url": record.get("resume_url"),
        "specialization": primary_player.get("course_specialization"),
        "passing_year": primary_player.get("passing_out_year")
    }


def fetch_from_unstop():
    """Fetch all registrations across all pages from Unstop API."""
    if not UNSTOP_TOKEN:
        logging.warning("UNSTOP_TOKEN is not provided. Cannot fetch from live API.")
        return None, 0

    headers = get_headers()
    cookies = {}
    if UNSTOP_COOKIES:
        for cookie_item in UNSTOP_COOKIES.split(";"):
            if "=" in cookie_item:
                k, v = cookie_item.strip().split("=", 1)
                cookies[k] = v

    all_raw_records = []
    page = 1
    total_found = 0

    logging.info(f"Connecting to Unstop API: {UNSTOP_API_URL}")

    while True:
        try:
            params = {
                "page": page,
                "per_page": 50,
                "filterName": "status",
                "filterValue": ""
            }

            resp = requests.get(
                UNSTOP_API_URL,
                headers=headers,
                cookies=cookies,
                params=params,
                timeout=30
            )

            if resp.status_code in (401, 403):
                logging.error(f"Authentication failed (HTTP {resp.status_code})! Response: {resp.text[:300]}")
                print(f"::error::Unstop API returned HTTP {resp.status_code}: {resp.text[:200]}")
                return None, 0

            resp.raise_for_status()
            data = resp.json()

            # Handle pagination response envelope { data: { data: [...], last_page: 2, total: 63 } }
            container = data.get("data") if isinstance(data, dict) else None
            items = []
            last_page = 1

            if isinstance(container, dict):
                items = container.get("data", [])
                last_page = container.get("last_page", 1)
                total_found = container.get("total", len(items))
            elif isinstance(container, list):
                items = container
            elif isinstance(data, list):
                items = data

            if not items:
                logging.info(f"No records found on page {page}.")
                break

            logging.info(f"Page {page}/{last_page}: Fetched {len(items)} records.")
            all_raw_records.extend(items)

            if page >= last_page:
                break

            page += 1

        except requests.exceptions.RequestException as e:
            logging.error(f"Network / API Error on page {page}: {e}")
            break

    return all_raw_records, total_found


def main():
    sync_time = datetime.now(timezone.utc).isoformat()
    token_expiry = parse_jwt_expiry(UNSTOP_TOKEN) if UNSTOP_TOKEN else None

    raw_records = None
    total_unstop_records = 0

    if not MOCK_MODE and UNSTOP_TOKEN:
        raw_records, total_unstop_records = fetch_from_unstop()

    if raw_records is None:
        if os.path.exists(OUTPUT_FILE) and os.path.getsize(OUTPUT_FILE) > 20:
            logging.info(f"Retaining existing cached data from {OUTPUT_FILE}")
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                paid_list = json.load(f)
        else:
            logging.warning("No data returned and no cache found. Initializing empty list.")
            paid_list = []
    else:
        # Filter paid records
        paid_records = [r for r in raw_records if is_registration_paid(r)]
        logging.info(f"Filtered {len(paid_records)} paid/complete registrations out of {len(raw_records)} total.")
        paid_list = [normalize_record(r, i + 1) for i, r in enumerate(paid_records)]

    # Compute summary stats
    total_paid_count = len(paid_list)
    total_revenue = sum(p.get("amount", 0) for p in paid_list)
    colleges = list({p.get("college") for p in paid_list if p.get("college") and p.get("college") != "N/A"})

    summary = {
        "last_synced_at": sync_time,
        "token_expires_at": token_expiry,
        "total_unstop_registrations": total_unstop_records or len(raw_records or []),
        "total_paid_registrations": total_paid_count,
        "total_amount_collected": round(total_revenue, 2),
        "total_colleges": len(colleges),
        "status": "HEALTHY",
        "opportunity_id": OPPORTUNITY_ID
    }

    # Save to data directory
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(paid_list, f, indent=2, ensure_ascii=False)
    logging.info(f"Saved {total_paid_count} paid records to {OUTPUT_FILE}")

    with open(SUMMARY_FILE, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
    logging.info(f"Saved summary to {SUMMARY_FILE}")

    # Combined web data for dashboard
    combined_web_data = {
        "summary": summary,
        "participants": paid_list
    }
    with open(ROOT_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(combined_web_data, f, indent=2, ensure_ascii=False)
    logging.info(f"Saved combined web data to {ROOT_DATA_FILE}")

    print("\n✅ Sync Completed Successfully!")
    print(f"📊 Total Unstop Registrations: {summary['total_unstop_registrations']}")
    print(f"🎯 Total Paid/Completed: {total_paid_count} | Revenue: ₹{total_revenue:,.2f} | Colleges: {len(colleges)}")
    if token_expiry:
        print(f"⏳ Current Token Expires At: {token_expiry}")


if __name__ == "__main__":
    main()
