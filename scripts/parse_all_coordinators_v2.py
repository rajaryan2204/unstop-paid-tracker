import json
import re
import html
import requests
import time
from scripts.fetch_registrations import login_to_unstop, get_headers

def clean_html(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r'<br\s*/?>', '\n', raw_html, flags=re.I)
    text = re.sub(r'</p>', '\n', text, flags=re.I)
    text = re.sub(r'</li>', '\n', text, flags=re.I)
    text = re.sub(r'</div>', '\n', text, flags=re.I)
    text = re.sub(r'</td>', '\t', text, flags=re.I)
    text = re.sub(r'</tr>', '\n', text, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = html.unescape(text)
    lines = [re.sub(r'[ \t]+', ' ', l).strip() for l in text.split('\n')]
    return '\n'.join([l for l in lines if l])

def parse_coordinators_from_text(text, event_title, event_id):
    coords = []
    lines = text.split('\n')
    
    for i, line in enumerate(lines):
        line_clean = line.strip()
        
        # Format A / B inline:
        # e.g.: Domain Coordinator: Amit Kumar, 254013105/GCT, 8010064068
        # e.g.: Domain Coordinator: Apurv Raj (254073145/GME), +91 7488233310
        m_inline = re.search(r'(Domain Coordinator|Event Coordinator|Student Coordinator)[\s:]+([A-Za-z\s]+?)(?:[\s,\(\[]*(\d+/[A-Za-z]+|\d+)[\s,\)\]]*)?[,:\s]+(?:\+?91[\s-]?)?([6-9]\d{9})', line_clean, re.I)
        if m_inline:
            role = m_inline.group(1).strip()
            name = m_inline.group(2).strip()
            phone = m_inline.group(4).strip()
            email = 'techfest@sliet.ac.in'
            for j in range(max(0, i-2), min(len(lines), i+3)):
                em_m = re.search(r'([a-zA-Z0-9_.+-]+@sliet\.ac\.in|[a-zA-Z0-9_.+-]+@gmail\.com)', lines[j])
                if em_m:
                    email = em_m.group(1).strip()
                    break
            coords.append({
                'name': name,
                'phone': phone,
                'email': email,
                'role': role,
                'event_title': event_title,
                'event_id': event_id,
                'source': 'details_inline'
            })
            continue

        # Format C multiline:
        # Line i: Domain Coordinator:
        # Line i+1: Contact: 6392656113
        # Line i+2: Email: samar_2444117@sliet.ac.in
        m_header = re.match(r'^(Domain Coordinator|Event Coordinator|Student Coordinator)[\s:]*$', line_clean, re.I)
        if m_header:
            role = m_header.group(1).strip()
            name = ""
            phone = ""
            email = ""
            for offset in range(1, 6):
                if i + offset >= len(lines):
                    break
                nxt = lines[i + offset]
                if re.match(r'^(Domain Coordinator|Event Coordinator)', nxt, re.I):
                    break
                ph_m = re.search(r'(?:Contact|Phone|Mobile|Mob)?[\s:]*(?:\+?91[\s-]?)?([6-9]\d{9})', nxt, re.I)
                if ph_m and not phone:
                    phone = ph_m.group(1)
                em_m = re.search(r'([a-zA-Z0-9_.+-]+@sliet\.ac\.in|[a-zA-Z0-9_.+-]+@gmail\.com)', nxt, re.I)
                if em_m and not email:
                    email = em_m.group(1)
                    if not name:
                        prefix = email.split('@')[0].split('_')[0]
                        name = prefix.capitalize()
                if not name and not ph_m and not em_m and len(nxt.split()) <= 4 and re.match(r'^[A-Za-z\s]+$', nxt):
                    name = nxt.strip()

            if phone or email:
                coords.append({
                    'name': name or f"{role}",
                    'phone': phone or "N/A",
                    'email': email or "techfest@sliet.ac.in",
                    'role': role,
                    'event_title': event_title,
                    'event_id': event_id,
                    'source': 'details_multiline'
                })

    return coords

def main():
    print("=" * 60)
    print("Starting Comprehensive TechFEST '26 Unstop Coordinator Extraction...")
    session = requests.Session()
    token, cookies = login_to_unstop('raj.aryan9242@gmail.com', 'Aryan2204*', session)
    if not token:
        print("❌ Login failed!")
        return

    headers = get_headers(token, cookies)
    print("✅ Authenticated with Unstop!")

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
        # Fallbacks for specific known names
        if 'lfr' in clean_title or 'line' in clean_title:
            return domain_events.get('robozar')
        if 'aqua-epoch' in clean_title or 'big bull' in clean_title or 'quiz nova' in clean_title:
            return domain_events.get('atomheimer')
        if 'tech4earth' in clean_title or 'food' in clean_title:
            return domain_events.get('foodocrats')
        if 'techno-vation' in clean_title or 'smart agriculture' in clean_title or 'cognitive' in clean_title:
            return domain_events.get('inventia')
        if 'mechnovate' in clean_title or 'designare' in clean_title or 'hydraload' in clean_title or 'fabriquer' in clean_title:
            return domain_events.get('mechanica')
        if 'bgmi' in clean_title or 'free fire' in clean_title or 'chess' in clean_title:
            return domain_events.get('kermis')
        return {'id': 'general', 'name': 'Central / Other'}

    all_data = {
        dom_id: {
            'domain_id': dom_id,
            'domain_name': dom['name'],
            'events': {},
            'coordinators': []
        }
        for dom_id, dom in domain_events.items()
    }
    all_data['general'] = {'domain_id': 'general', 'domain_name': 'Central / Other', 'events': {}, 'coordinators': []}

    print(f"Fetching {len(events_list)} events from Unstop API...")
    for idx, ev in enumerate(events_list, 1):
        eid = ev['id']
        title = ev['title']
        dom = find_domain_for_event(title)
        dom_id = dom['id']

        url = f"https://unstop.com/api/opportunity/{eid}"
        try:
            resp = session.get(url, headers=headers, timeout=15)
            if resp.status_code == 200:
                opp = resp.json().get('data', {})
                api_contacts = opp.get('contacts', [])
                details_html = opp.get('details', '')
                clean_txt = clean_html(details_html)
                parsed_coords = parse_coordinators_from_text(clean_txt, title, eid)

                combined_coords = []
                # 1. Add api contacts
                for c in api_contacts:
                    c_name = c.get('name') or ''
                    c_phone = c.get('contact_no') or 'N/A'
                    c_email = c.get('email') or 'N/A'
                    c_desig = c.get('designation') or 'Event Coordinator'
                    combined_coords.append({
                        'name': c_name.strip(),
                        'phone': c_phone.strip(),
                        'email': c_email.strip(),
                        'role': c_desig.strip(),
                        'event_title': title,
                        'event_id': eid,
                        'source': 'unstop_api_contact'
                    })

                # 2. Add parsed coordinators from details if not already present
                for pc in parsed_coords:
                    # check if phone or name is already in combined_coords
                    already = False
                    for existing in combined_coords:
                        if pc['phone'] != 'N/A' and pc['phone'] in existing['phone']:
                            already = True
                            break
                        if pc['name'].lower() == existing['name'].lower() and len(pc['name']) > 2:
                            already = True
                            break
                    if not already:
                        combined_coords.append(pc)

                all_data[dom_id]['events'][title] = {
                    'event_id': eid,
                    'event_title': title,
                    'contacts_count': len(combined_coords),
                    'contacts': combined_coords
                }

                all_data[dom_id]['coordinators'].extend(combined_coords)
                print(f"[{idx:02d}/62] ✅ {title[:28]:<28} -> {dom['name']:<14} : {len(combined_coords)} coords")
            else:
                print(f"[{idx:02d}/62] ⚠️ {title} -> HTTP {resp.status_code}")
        except Exception as e:
            print(f"[{idx:02d}/62] ❌ Error on {title}: {e}")

        time.sleep(0.1)

    # For Mechanica, if 0 specific coordinators were in details, attach domain and overall coordinators
    if len(all_data['mechanica']['coordinators']) == 0:
        print("\nNote: Mechanica events route queries through central coordination. Adding official contact channels.")
        all_data['mechanica']['coordinators'] = [
            {
                'name': 'Shubham Kumar Singh',
                'phone': '+91 97711 74465',
                'email': 'techfest@sliet.ac.in',
                'role': 'Overall Student Coordinator / Mechanica Lead',
                'event_title': 'Mechanica Domain (Mechnovate, Designare, Hydraload, Fabriquer)',
                'event_id': 1744211,
                'source': 'official_unstop_listing'
            },
            {
                'name': 'Naman Kumar Sinha',
                'phone': '+91 78568 93952',
                'email': 'techfest@sliet.ac.in',
                'role': 'Overall Student Coordinator',
                'event_title': 'Mechanica Domain (Mechnovate, Designare, Hydraload, Fabriquer)',
                'event_id': 1744211,
                'source': 'official_unstop_listing'
            }
        ]

    # Save to json
    with open('data/all_domains_coordinators.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print("FINAL SUMMARY BY DOMAIN:")
    for dom_id, val in all_data.items():
        if dom_id == 'general' and len(val['coordinators']) == 0:
            continue
        print(f"  • {val['domain_name']} ({dom_id}): {len(val['coordinators'])} coordinators across {len(val['events'])} events")
    print("=" * 60)
    print("Saved combined data to data/all_domains_coordinators.json")

if __name__ == '__main__':
    main()
