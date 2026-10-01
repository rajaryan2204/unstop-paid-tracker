import json
import requests
import re
import html
from scripts.fetch_registrations import login_to_unstop, get_headers

def clean_html(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r'<br\s*/?>', '\n', raw_html, flags=re.I)
    text = re.sub(r'</p>', '\n', text, flags=re.I)
    text = re.sub(r'</li>', '\n', text, flags=re.I)
    text = re.sub(r'</div>', '\n', text, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = html.unescape(text)
    return text

session = requests.Session()
token, cookies = login_to_unstop('raj.aryan9242@gmail.com', 'Aryan2204*', session)
headers = get_headers(token, cookies)

with open('data.json') as f:
    local_data = json.load(f)
events_list = local_data['summary'].get('events_list', [])

with open('src/utils/auth.js') as f:
    auth_text = f.read()

domain_events = {}
pattern = re.compile(r'(\w+):\s*{\s*id:\s*\'([^\']+)\',\s*name:\s*\'([^\']+)\',.*?events:\s*\[(.*?)\]', re.DOTALL)
for match in pattern.finditer(auth_text):
    dom_id, dom_key, dom_name, events_str = match.groups()
    ev_list = [e.strip(' \'\t\n\"') for e in events_str.split(',') if e.strip(' \'\t\n\"')]
    domain_events[dom_id] = {'id': dom_id, 'name': dom_name, 'events': ev_list}

def find_domain_for_event(title):
    clean_title = title.lower().strip()
    for dom_id, dom in domain_events.items():
        for ev in dom['events']:
            c_ev = ev.lower().strip()
            if c_ev == clean_title or c_ev in clean_title or clean_title in c_ev:
                return dom
    return {'id': 'general', 'name': 'Central / General'}

target_domains = ['kermis', 'mechanica', 'chemica', 'inventia', 'electronica']

for ev in events_list:
    dom = find_domain_for_event(ev['title'])
    if dom['id'] in target_domains:
        eid = ev['id']
        resp = session.get(f"https://unstop.com/api/opportunity/{eid}", headers=headers, timeout=10)
        if resp.status_code == 200:
            data = resp.json().get('data', {})
            details = clean_html(data.get('details', ''))
            contacts = data.get('contacts', [])
            print(f"\n==================== {ev['title']} ({dom['name']}) [Contacts in API: {len(contacts)}] ====================")
            lines = [l.strip() for l in details.split('\n') if l.strip()]
            for i, line in enumerate(lines):
                if any(k in line.lower() for k in ['coordinator', 'contact', 'call', 'reach out', '@sliet.ac.in', '+91']):
                    start = max(0, i)
                    end = min(len(lines), i+4)
                    chunk = " | ".join(lines[start:end])
                    print(f"  --> {chunk}")
