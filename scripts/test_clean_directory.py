import json
import re

def clean_phone(phone_str):
    if not phone_str or phone_str == 'N/A':
        return 'N/A'
    digits = re.sub(r'\D', '', phone_str)
    if digits.startswith('91') and len(digits) == 12:
        digits = digits[2:]
    if len(digits) == 10:
        return f"+91 {digits[:5]} {digits[5:]}"
    elif len(digits) == 9: # e.g. missed leading digit or 856893952
        return f"+91 {digits}"
    return phone_str.strip()

def clean_person_entry(raw_c):
    raw_name = raw_c.get('name', '').strip()
    role = raw_c.get('role', 'Event Coordinator').strip()
    
    # Extract role embedded in name
    m_role = re.search(r'\(([^)]+coordinator[^)]*)\)', raw_name, re.I)
    if m_role:
        role = m_role.group(1).title()
        raw_name = re.sub(r'\([^)]+\)', '', raw_name).strip()

    m_pref = re.match(r'^(Overall Coordinator|Domain Coordinator|Event Coordinator|Student Coordinator)[\s:]+(.*)', raw_name, re.I)
    if m_pref:
        role = m_pref.group(1).title()
        raw_name = m_pref.group(2).strip()

    # Clean name
    name = ' '.join([w.capitalize() for w in raw_name.split()])
    if not name or name.isdigit():
        if raw_c.get('email') and '@' in raw_c['email']:
            name_part = raw_c['email'].split('@')[0].split('_')[0]
            name = name_part.capitalize()
            if raw_c.get('name', '').isdigit():
                name += f" ({raw_c['name']})"
        else:
            name = f"Coordinator ({raw_name})" if raw_name else "Student Coordinator"

    phone = clean_phone(raw_c.get('phone'))
    email = raw_c.get('email', 'techfest@sliet.ac.in').strip().lower()
    event_title = raw_c.get('event_title', '').strip()

    return {
        'name': name,
        'role': role,
        'phone': phone,
        'email': email,
        'events': [event_title] if event_title else []
    }

with open('data/all_domains_coordinators.json') as f:
    raw_data = json.load(f)

curated_domains = {}

for dom_id, val in raw_data.items():
    if dom_id == 'general': continue
    dom_name = val['domain_name']
    coords = val['coordinators']
    
    person_dict = {}
    for c in coords:
        item = clean_person_entry(c)
        # Unique key by normalized name + phone
        norm_name = re.sub(r'[^a-z]', '', item['name'].lower())
        norm_phone = re.sub(r'\D', '', item['phone'])
        key = norm_name if norm_name else norm_phone
        
        if key in person_dict:
            # Merge events
            for ev in item['events']:
                if ev and ev not in person_dict[key]['events']:
                    person_dict[key]['events'].append(ev)
            # Update phone if previously N/A
            if person_dict[key]['phone'] == 'N/A' and item['phone'] != 'N/A':
                person_dict[key]['phone'] = item['phone']
            # Prioritize Domain Coordinator role
            if 'Domain' in item['role'] and 'Domain' not in person_dict[key]['role']:
                person_dict[key]['role'] = item['role']
        else:
            person_dict[key] = item

    curated_domains[dom_id] = {
        'domain_id': dom_id,
        'domain_name': dom_name,
        'coordinators': list(person_dict.values())
    }

for dom_id, val in curated_domains.items():
    print(f"\n[{val['domain_name'].upper()}] - {len(val['coordinators'])} Unique Coordinators:")
    for c in val['coordinators']:
        events_str = ", ".join(c['events']) if c['events'] else "Domain Level"
        print(f"  • {c['name']:<24} | {c['role']:<20} | {c['phone']:<16} | {c['email']:<32} | {events_str}")
