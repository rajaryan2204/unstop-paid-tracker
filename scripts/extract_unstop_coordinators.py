#!/usr/bin/env python3
import json
import time
import requests
import re
from scripts.fetch_registrations import login_to_unstop, get_headers

def main():
    print("=" * 60)
    print("Step 1: Logging in to Unstop...")
    session = requests.Session()
    token, cookies = login_to_unstop('raj.aryan9242@gmail.com', 'Aryan2204*', session)
    if not token:
        print("❌ Login failed!")
        return

    headers = get_headers(token, cookies)
    print("✅ Unstop token acquired successfully!")

    # Load 62 events from data.json
    with open('data.json') as f:
        local_data = json.load(f)
    events_list = local_data['summary'].get('events_list', [])
    print(f"Loaded {len(events_list)} events from data.json")

    # Load domain definitions from auth.js
    with open('src/utils/auth.js') as f:
        auth_text = f.read()

    domain_events = {}
    pattern = re.compile(r'(\w+):\s*{\s*id:\s*\'([^\']+)\',\s*name:\s*\'([^\']+)\',.*?events:\s*\[(.*?)\]', re.DOTALL)
    for match in pattern.finditer(auth_text):
        dom_id, dom_key, dom_name, events_str = match.groups()
        ev_list = [e.strip(' \'\t\n\"') for e in events_str.split(',') if e.strip(' \'\t\n\"')]
        domain_events[dom_id] = {
            'id': dom_id,
            'name': dom_name,
            'events': ev_list
        }

    # Map each event title to domain
    def find_domain_for_event(title):
        clean_title = title.lower().strip()
        for dom_id, dom in domain_events.items():
            for ev in dom['events']:
                c_ev = ev.lower().strip()
                if c_ev == clean_title or c_ev in clean_title or clean_title in c_ev:
                    return dom
        return {'id': 'general', 'name': 'Central / General'}

    print("=" * 60)
    print("Step 2: Fetching opportunity details & contacts for each event from Unstop...")
    
    all_contacts_by_domain = {dom_id: {'domain_name': dom['name'], 'events': {}, 'coordinators': []} for dom_id, dom in domain_events.items()}
    all_contacts_by_domain['general'] = {'domain_name': 'Central / Other', 'events': {}, 'coordinators': []}

    total = len(events_list)
    success_count = 0

    for idx, ev in enumerate(events_list, 1):
        eid = ev['id']
        title = ev['title']
        dom = find_domain_for_event(title)
        dom_id = dom['id']

        url = f"https://unstop.com/api/opportunity/{eid}"
        try:
            resp = session.get(url, headers=headers, timeout=15)
            if resp.status_code == 200:
                opp_data = resp.json().get('data', {})
                contacts = opp_data.get('contacts', [])
                success_count += 1
                
                all_contacts_by_domain[dom_id]['events'][title] = {
                    'id': eid,
                    'title': title,
                    'contacts': contacts
                }

                for c in contacts:
                    all_contacts_by_domain[dom_id]['coordinators'].append({
                        'event_name': title,
                        'event_id': eid,
                        'name': c.get('name'),
                        'phone': c.get('contact_no') or 'N/A',
                        'email': c.get('email') or 'N/A',
                        'designation': c.get('designation') or 'Event Coordinator'
                    })

                print(f"[{idx}/{total}] ✅ {title} (ID {eid}) -> {dom['name']} : {len(contacts)} contacts")
            else:
                print(f"[{idx}/{total}] ⚠️ {title} (ID {eid}) HTTP {resp.status_code}")
        except Exception as e:
            print(f"[{idx}/{total}] ❌ Error on {title}: {e}")

        # Small courtesy delay
        time.sleep(0.15)

    print("=" * 60)
    print(f"Successfully processed {success_count}/{total} events.")
    
    # Save raw json output
    with open('data/unstop_all_coordinators.json', 'w', encoding='utf-8') as f:
        json.dump(all_contacts_by_domain, f, indent=2, ensure_ascii=False)
    print("Saved raw contacts to data/unstop_all_coordinators.json")

if __name__ == '__main__':
    main()
