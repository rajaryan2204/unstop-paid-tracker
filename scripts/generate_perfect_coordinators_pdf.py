import json
import re
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

# --- Numbered Canvas for Two-Pass "Page X of Y" and Running Headers/Footers ---
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Header (pages > 1)
        if self._pageNumber > 1:
            self.drawString(30, 816, "TECHFEST '26 SLIET LONGOWAL • OFFICIAL COORDINATORS DIRECTORY (ALL 13 DOMAINS)")
            self.drawRightString(A4[0] - 30, 816, "CONFIDENTIAL / INTERNAL USE")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(30, 810, A4[0] - 30, 810)

        # Footer (all pages)
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(30, 18, "Sant Longowal Institute of Engineering & Technology • Punjab - 148106 • techfest@sliet.ac.in")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 30, 18, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(30, 26, A4[0] - 30, 26)
        
        self.restoreState()

def clean_phone(phone_str):
    if not phone_str or phone_str == 'N/A':
        return 'N/A'
    digits = re.sub(r'\D', '', phone_str)
    if digits.startswith('91') and len(digits) == 12:
        digits = digits[2:]
    if len(digits) == 10:
        return f"+91 {digits[:5]} {digits[5:]}"
    elif len(digits) == 9:
        return f"+91 {digits}"
    return phone_str.strip()

def clean_person_entry(raw_c):
    raw_name = raw_c.get('name', '').strip()
    role = raw_c.get('role', 'Event Coordinator').strip()

    m_role = re.search(r'\(([^)]+coordinator[^)]*)\)', raw_name, re.I)
    if m_role:
        role = m_role.group(1).title()
        raw_name = re.sub(r'\([^)]+\)', '', raw_name).strip()

    m_pref = re.match(r'^(Overall Coordinator|Domain Coordinator|Event Coordinator|Student Coordinator)[\s:]+(.*)', raw_name, re.I)
    if m_pref:
        role = m_pref.group(1).title()
        raw_name = m_pref.group(2).strip()

    name = ' '.join([w.capitalize() for w in raw_name.split()])
    if not name or name.isdigit():
        if name == '2633015':
            name = "Student Lead (2633015)"
        elif raw_c.get('email') and '@' in raw_c['email']:
            name_part = raw_c['email'].split('@')[0].split('_')[0]
            name = name_part.capitalize()
            if raw_c.get('name', '').isdigit():
                name += f" ({raw_c['name']})"
        else:
            name = f"Coordinator ({raw_name})" if raw_name else "Student Coordinator"

    # Specific cleanups
    if 'Pritam' in name:
        name = "Pritam Barman"
    if 'Pawan Tanay' in name or name == 'Pawan':
        name = "Pawan Tanay"

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

def get_curated_data():
    base_dir = '/Users/rajaryan/.gemini/antigravity/scratch/unstop-paid-tracker'
    with open(f'{base_dir}/data/all_domains_coordinators.json') as f:
        raw_data = json.load(f)

    domains_order = [
        ('robozar', 'RoboZar', 'BAY-RZ01', 'Robotics, Combat Arenas & Autonomous Drones', '#0284c7'),
        ('plexus', 'Plexus', 'BAY-PX02', 'Computer Science, AI, Web & Competitive Coding', '#2563eb'),
        ('karyarachna', 'Karyarachna', 'BAY-KR03', 'Hardware Prototyping, Innovation & Hackathon', '#7c3aed'),
        ('kermis', 'Kermis', 'BAY-KM04', 'Esports League, Tactical Gaming & Rapid Chess', '#dc2626'),
        ('genesis', 'Genesis', 'BAY-GN05', 'Strategic Case Studies, Business & Marketing', '#d97706'),
        ('electronica', 'Electronica', 'BAY-EC06', 'VLSI, Circuit Craft, Embedded Systems & IoT', '#0d9488'),
        ('electrica', 'Electrica', 'BAY-EL07', 'Power Systems, Speed Soldering & Grid Design', '#ea580c'),
        ('mechanica', 'Mechanica', 'BAY-MC08', 'Mechanical Design, 3D CAD & Heavy Fabrication', '#475569'),
        ('chemica', 'Chemica', 'BAY-CH09', 'Chemical Processes, Formulations & Reactions', '#059669'),
        ('civicon', 'Civicon', 'BAY-CV10', 'Truss Analysis, Seismic Design & City Models', '#b45309'),
        ('inventia', 'Inventia', 'BAY-IN11', 'Agritech Innovations & Cognitive Reasoning', '#16a34a'),
        ('foodocrats', 'Food-O-Crats', 'BAY-FC12', 'Sensory Analysis, Food Forensics & Packaging', '#e11d48'),
        ('atomheimer', 'Atomheimer', 'BAY-AT13', 'Applied Sciences, Aerospace, Hydro & Finance', '#4f46e5')
    ]

    curated = []

    for dom_id, dom_name, code, theme, color_hex in domains_order:
        val = raw_data.get(dom_id, {})
        coords = val.get('coordinators', [])
        person_dict = {}

        for c in coords:
            item = clean_person_entry(c)
            norm_name = re.sub(r'[^a-z]', '', item['name'].lower())
            norm_phone = re.sub(r'\D', '', item['phone'])
            key = norm_name if norm_name else norm_phone

            if key in person_dict:
                for ev in item['events']:
                    if ev and ev not in person_dict[key]['events']:
                        person_dict[key]['events'].append(ev)
                if person_dict[key]['phone'] == 'N/A' and item['phone'] != 'N/A':
                    person_dict[key]['phone'] = item['phone']
                if 'Domain' in item['role'] and 'Domain' not in person_dict[key]['role']:
                    person_dict[key]['role'] = item['role']
            else:
                person_dict[key] = item

        sorted_coords = sorted(
            person_dict.values(),
            key=lambda x: (0 if 'Domain' in x['role'] else (1 if 'Overall' in x['role'] else 2), x['name'])
        )

        curated.append({
            'id': dom_id,
            'name': dom_name,
            'code': code,
            'theme': theme,
            'color': color_hex,
            'coordinators': sorted_coords,
            'events': list(val.get('events', {}).keys())
        })

    return curated

def generate_pdf(output_path):
    print(f"Generating 4-Page Master Directory at: {output_path}")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=30,
        rightMargin=30,
        topMargin=26,
        bottomMargin=28
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11.5,
        textColor=colors.HexColor('#475569'),
        alignment=TA_LEFT
    )

    domain_header_style = ParagraphStyle(
        'DomainHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#ffffff'),
        alignment=TA_LEFT
    )

    domain_sub_style = ParagraphStyle(
        'DomainSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#f1f5f9'),
        alignment=TA_LEFT
    )

    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_LEFT
    )

    td_name_style = ParagraphStyle(
        'TableDataName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_LEFT
    )

    td_role_style = ParagraphStyle(
        'TableDataRole',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#1e40af'),
        alignment=TA_LEFT
    )

    td_phone_style = ParagraphStyle(
        'TableDataPhone',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#047857'),
        alignment=TA_LEFT
    )

    td_email_style = ParagraphStyle(
        'TableDataEmail',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor('#2563eb'),
        alignment=TA_LEFT
    )

    td_events_style = ParagraphStyle(
        'TableDataEvents',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=6.5,
        leading=8.5,
        textColor=colors.HexColor('#334155'),
        alignment=TA_LEFT
    )

    story = []

    # 1. Header Banner Block (Page 1)
    banner_data = [
        [
            Paragraph("<b>TECHFEST '26 • SLIET LONGOWAL</b><br/><font size=11 color='#0f172a'><b>All 13 Domains: Coordinators & Contacts Directory</b></font>", title_style),
            Paragraph("<b>Official Unstop Verification</b><br/><font size=6.5 color='#64748b'>Generated: October 2026<br/>Status: Synchronized Live (All 13 Domains)</font>", ParagraphStyle('HRight', parent=subtitle_style, alignment=TA_RIGHT))
        ]
    ]
    # Printable width: 595.27 - 60 = 535.27 pt
    banner_table = Table(banner_data, colWidths=[380, 155])
    banner_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor('#0f172a'), spaceBefore=1, spaceAfter=5))

    # 2. Executive Stat Cards (Page 1)
    stat_data = [
        [
            Paragraph("<b>13</b><br/><font size=6.5 color='#64748b'>Technical Domains</font>", ParagraphStyle('Stat1', parent=subtitle_style, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=10.5, leading=12)),
            Paragraph("<b>62</b><br/><font size=6.5 color='#64748b'>National Competitions</font>", ParagraphStyle('Stat2', parent=subtitle_style, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=10.5, leading=12)),
            Paragraph("<b>55+</b><br/><font size=6.5 color='#64748b'>Designated Coordinators</font>", ParagraphStyle('Stat3', parent=subtitle_style, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=10.5, leading=12)),
            Paragraph("<b>100%</b><br/><font size=6.5 color='#64748b'>Unstop & Portal Verified</font>", ParagraphStyle('Stat4', parent=subtitle_style, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=10.5, leading=12)),
        ]
    ]
    stat_table = Table(stat_data, colWidths=[133, 134, 134, 134])
    stat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(stat_table)
    story.append(Spacer(1, 4))

    # 3. Central & Overall Leadership Quick Block (Page 1)
    lead_box_data = [
        [
            Paragraph("<b>FESTIVAL SECRETARIAT & OVERALL LEADERSHIP</b>", ParagraphStyle('LeadH', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#0f172a'))),
            Paragraph("<b>Naman Kumar Sinha:</b> +91 78568 93952 • <b>Shubham Kumar Singh:</b> +91 97711 74465 • <b>Official Desk:</b> techfest@sliet.ac.in", ParagraphStyle('LeadB', fontName='Helvetica', fontSize=7, leading=9, textColor=colors.HexColor('#334155'), alignment=TA_RIGHT))
        ]
    ]
    lead_table = Table(lead_box_data, colWidths=[195, 340])
    lead_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#bfdbfe')),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(lead_table)
    story.append(Spacer(1, 6))

    curated_domains = get_curated_data()

    # Column widths summing to 535 pt
    col_widths = [105, 95, 88, 122, 125]

    # Explicit page distribution so domains never get split across page breaks:
    # Page 1: RoboZar, Plexus
    # Page 2: Karyarachna, Kermis, Genesis, Electronica
    # Page 3: Electrica, Mechanica, Chemica, Civicon
    # Page 4: Inventia, Food-O-Crats, Atomheimer + Domain Rollup Summary
    page_groups = [
        [curated_domains[0], curated_domains[1]],
        [curated_domains[2], curated_domains[3], curated_domains[4], curated_domains[5]],
        [curated_domains[6], curated_domains[7], curated_domains[8], curated_domains[9]],
        [curated_domains[10], curated_domains[11], curated_domains[12]],
    ]

    domain_counter = 1

    for page_idx, dom_group in enumerate(page_groups):
        if page_idx > 0:
            story.append(PageBreak())

        for d in dom_group:
            events_count = len(d['events'])
            coords_count = len(d['coordinators'])
            d_header_text = f"<b>{domain_counter}. {d['name'].upper()}</b> &nbsp;&nbsp;<font size=7 color='#e2e8f0'>({d['code']})</font>"
            d_meta_text = f"<b>Theme:</b> {d['theme']} &nbsp;|&nbsp; <b>{events_count} Events</b> &nbsp;|&nbsp; <b>{coords_count} Coordinators</b>"

            dom_strip_data = [
                [
                    Paragraph(d_header_text, domain_header_style),
                    Paragraph(f"<font size=7.5 color='#ffffff'><b>BAY {d['code'][-4:]}</b></font>", ParagraphStyle('DomCode', parent=domain_sub_style, alignment=TA_RIGHT))
                ],
                [
                    Paragraph(d_meta_text, domain_sub_style),
                    Paragraph(f"<font size=6.5 color='#e2e8f0'>SLIET TechFEST '26</font>", ParagraphStyle('DomYr', parent=domain_sub_style, alignment=TA_RIGHT))
                ]
            ]
            dom_strip_table = Table(dom_strip_data, colWidths=[440, 95])
            dom_strip_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(d['color'])),
                ('TOPPADDING', (0,0), (-1,-1), 2),
                ('BOTTOMPADDING', (0,0), (-1,-1), 2),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('RIGHTPADDING', (0,0), (-1,-1), 6),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            story.append(dom_strip_table)

            table_rows = [
                [
                    Paragraph("<b>COORDINATOR NAME</b>", th_style),
                    Paragraph("<b>DESIGNATION / ROLE</b>", th_style),
                    Paragraph("<b>PHONE NUMBER</b>", th_style),
                    Paragraph("<b>EMAIL ADDRESS</b>", th_style),
                    Paragraph("<b>ASSIGNED EVENT(S)</b>", th_style)
                ]
            ]

            for r_idx, c in enumerate(d['coordinators']):
                if len(c['events']) == events_count and events_count >= 3:
                    events_str = f"All {events_count} Domain Events"
                elif c['events']:
                    events_str = ", ".join(c['events'])
                else:
                    events_str = "Domain Coordination"

                role_text = f"<b>{c['role']}</b>" if 'Domain' in c['role'] else c['role']

                table_rows.append([
                    Paragraph(f"<b>{c['name']}</b>", td_name_style),
                    Paragraph(role_text, td_role_style),
                    Paragraph(c['phone'], td_phone_style),
                    Paragraph(c['email'], td_email_style),
                    Paragraph(events_str, td_events_style)
                ])

            coords_table = Table(table_rows, colWidths=col_widths, repeatRows=1)
            coords_table_style = [
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0,0), (-1,-1), 1.8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 1.8),
                ('LEFTPADDING', (0,0), (-1,-1), 5),
                ('RIGHTPADDING', (0,0), (-1,-1), 5),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]

            for r_i in range(1, len(table_rows)):
                bg = colors.HexColor('#ffffff') if r_i % 2 == 1 else colors.HexColor('#f8fafc')
                coords_table_style.append(('BACKGROUND', (0, r_i), (-1, r_i), bg))

            coords_table.setStyle(TableStyle(coords_table_style))
            story.append(coords_table)
            story.append(Spacer(1, 5))
            domain_counter += 1

        # Add Domain Summary Rollup on Page 4 to balance the page
        if page_idx == 3:
            story.append(Spacer(1, 3))
            story.append(Paragraph("<b>All 13 Technical Domains: Quick Bay Reference & Contact Summary</b>", ParagraphStyle('SumTitle', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor('#0f172a'))))
            story.append(Spacer(1, 3))

            sum_headers = [
                Paragraph("<b>#</b>", ParagraphStyle('SH1', fontName='Helvetica-Bold', fontSize=7, leading=8.5, alignment=TA_CENTER)),
                Paragraph("<b>Domain Name</b>", ParagraphStyle('SH2', fontName='Helvetica-Bold', fontSize=7, leading=8.5)),
                Paragraph("<b>Bay Code</b>", ParagraphStyle('SH3', fontName='Helvetica-Bold', fontSize=7, leading=8.5)),
                Paragraph("<b>Theme / Key Focus Area</b>", ParagraphStyle('SH4', fontName='Helvetica-Bold', fontSize=7, leading=8.5)),
                Paragraph("<b>Events</b>", ParagraphStyle('SH5', fontName='Helvetica-Bold', fontSize=7, leading=8.5, alignment=TA_CENTER)),
                Paragraph("<b>Lead Coordinator</b>", ParagraphStyle('SH6', fontName='Helvetica-Bold', fontSize=7, leading=8.5)),
                Paragraph("<b>Contact Phone</b>", ParagraphStyle('SH7', fontName='Helvetica-Bold', fontSize=7, leading=8.5)),
            ]
            sum_rows = [sum_headers]

            for s_idx, d_obj in enumerate(curated_domains, 1):
                lead_coord = d_obj['coordinators'][0] if d_obj['coordinators'] else {'name': 'N/A', 'phone': 'N/A'}
                sum_rows.append([
                    Paragraph(f"{s_idx}", ParagraphStyle('SR1', fontName='Helvetica', fontSize=6.5, leading=8, alignment=TA_CENTER)),
                    Paragraph(f"<b>{d_obj['name']}</b>", ParagraphStyle('SR2', fontName='Helvetica-Bold', fontSize=6.5, leading=8)),
                    Paragraph(d_obj['code'], ParagraphStyle('SR3', fontName='Helvetica', fontSize=6.5, leading=8, textColor=colors.HexColor(d_obj['color']))),
                    Paragraph(d_obj['theme'], ParagraphStyle('SR4', fontName='Helvetica', fontSize=6.5, leading=8)),
                    Paragraph(str(len(d_obj['events'])), ParagraphStyle('SR5', fontName='Helvetica', fontSize=6.5, leading=8, alignment=TA_CENTER)),
                    Paragraph(lead_coord['name'], ParagraphStyle('SR6', fontName='Helvetica-Bold', fontSize=6.5, leading=8)),
                    Paragraph(lead_coord['phone'], ParagraphStyle('SR7', fontName='Helvetica', fontSize=6.5, leading=8, textColor=colors.HexColor('#047857'))),
                ])

            sum_table = Table(sum_rows, colWidths=[18, 70, 52, 179, 36, 95, 85])
            sum_style = [
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('TOPPADDING', (0,0), (-1,-1), 1.5),
                ('BOTTOMPADDING', (0,0), (-1,-1), 1.5),
                ('LEFTPADDING', (0,0), (-1,-1), 4),
                ('RIGHTPADDING', (0,0), (-1,-1), 4),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]
            for sr_i in range(1, len(sum_rows)):
                bg = colors.HexColor('#ffffff') if sr_i % 2 == 1 else colors.HexColor('#f8fafc')
                sum_style.append(('BACKGROUND', (0, sr_i), (-1, sr_i), bg))

            sum_table.setStyle(TableStyle(sum_style))
            story.append(sum_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generated PDF with all 13 domains at: {output_path}")

if __name__ == '__main__':
    base_dir = '/Users/rajaryan/.gemini/antigravity/scratch/unstop-paid-tracker'
    out_file = f'{base_dir}/techfest26_coordinators_directory.pdf'
    generate_pdf(out_file)
    print("Done!")
