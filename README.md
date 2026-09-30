# 🎯 Unstop Paid Registrations Tracker & Dashboard

An automated tracker that fetches participant registrations from Unstop, filters out verified **paid participants**, and publishes them to a modern web dashboard every **8 hours** using **GitHub Actions & GitHub Pages**.

---

## ⚡ Features

- **Automated 8-Hour Sync**: GitHub Actions runs every 8 hours on cron (`0 */8 * * *`) and on-demand via manual trigger.
- **Auto Payment Filtering**: Filters only participants whose payments are marked as `PAID` / `SUCCESS`.
- **Live Web Panel**:
  - 📊 Real-time Metrics: Total Paid Participants, Total Revenue (₹), Colleges Count, Team Members Count.
  - 🔍 Instant Search: Search by Name, Email, Phone, College, Team Name, or Payment ID.
  - 🏫 College Filter & Sorting (Newest, Oldest, Amount, Name).
  - 👥 Team Inspector: Modal preview showing team members, emails, and contact details.
  - 📥 1-Click Export to CSV/Excel for spreadsheets.
- **Zero Cost**: Runs 100% free on GitHub Actions and GitHub Pages.

---

## 🚀 Quick Setup Guide

### 1. Unstop se API Endpoint aur Token nikalna (DevTools)

1. Apne browser me **Unstop** login karo (organizer email se: `raj.aryan9242@gmail.com`).
2. Apne **Event Dashboard** -> **Registrations / Participants** wale page par jao.
3. Keyboard par `F12` ya `Right Click -> Inspect` dabao, aur **Network** tab open karo.
4. Filter me **Fetch/XHR** select karo aur page refresh karo.
5. List me se registrations wali request dhundo (jaise `registrations?event_id=...` ya `participants`):
   - **Request URL** copy karo: Yeh aapka `UNSTOP_API_URL` hoga.
   - **Request Headers** me jao: `Authorization` header copy karo (e.g. `Bearer eyJhbGci...`) — yeh aapka `UNSTOP_TOKEN` hoga.

---

### 2. GitHub Secrets Setup Karna

Repo me token secure rakhne ke liye:

1. Apni GitHub Repository par jao: **Settings** -> **Secrets and variables** -> **Actions**.
2. **New repository secret** button par click karo:
   - **Name**: `UNSTOP_API_URL`
   - **Secret**: Copy kiya hua URL paste karo
3. Ek aur secret add karo:
   - **Name**: `UNSTOP_TOKEN`
   - **Secret**: Copy kiya hua Token paste karo (ya cookies agar cookie-based auth ho toh `UNSTOP_COOKIES`)

---

### 3. Sagar ko Invite Bhejna (Collaborator)

1. Repository ke **Settings** tab me jao.
2. Left sidebar me **Collaborators** par click karo.
3. **Add people** button par click karke Sagar ka GitHub username ya email enter karke invite bhej do.

---

### 4. GitHub Pages (Live Webpage) Enable Karna

1. Repository ke **Settings** -> **Pages** me jao.
2. **Build and deployment** me:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/(root)`
3. **Save** par click karo.
4. Dashboard live link:  
   `https://sagar-anmol.github.io/unstop-paid-tracker/`

---

### 5. Manual Sync / Testing

Aapko 8 ghante wait karne ki zarurat nahi hai test karne ke liye:
1. GitHub par **Actions** tab me jao.
2. Left me **Sync Unstop Paid Registrations** workflow select karo.
3. **Run workflow** button par click karo.
4. Script run hogi aur latest data commit ho jayega!

---

## 💻 Local Development

```bash
# 1. Clone repository
git clone https://github.com/sagar-anmol/unstop-paid-tracker.git
cd unstop-paid-tracker

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) Run with environment variables
export UNSTOP_API_URL="https://unstop.com/api/..."
export UNSTOP_TOKEN="Bearer ..."
python scripts/fetch_registrations.py

# 4. View dashboard in browser
python3 -m http.server 8000
# Open http://localhost:8000 in your browser
```
