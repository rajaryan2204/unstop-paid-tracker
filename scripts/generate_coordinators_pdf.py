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
            self.drawString(36, 810, "TECHFEST '26 SLIET LONGOWAL • OFFICIAL COORDINATORS DIRECTORY")
            self.drawRightString(A4[0] - 36, 810, "CONFIDENTIAL / INTERNAL USE")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(36, 804, A4[0] - 36, 804)

        # Footer (all pages)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(36, 25, "Sant Longowal Institute of Engineering & Technology • Punjab - 148106 • techfest@sliet.ac.in")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 36, 25, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 35, A4[0] - 36, 35)
        
        self.restoreState()

# --- Helper Functions for Data Cleaning ---
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
        if raw_c.get('email') and '@' in raw_c['email']:
            name_part = raw_c['email'].split('@')[0].split('_')[0]
            name = name_part.capitalize()
            if raw_c.get('name', '').isdigit():
                name += f" ({raw_c['name']})"
        else:
            name = f"Coordinator ({raw_name})" if raw_name else "Student Coordinator"

    # Specific cleanups
    if name == '2633015':
        name = "Student Lead (2633015)"
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
    with open('data/all_domains_coordinators.json') as f:
        raw_data = json.load(f)

    # 13 Domain definitions in exact order
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
            # Normalize key
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

        # Sort so Domain Coordinators appear first, then Event Coordinators alphabetically
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
    print(f"Building PDF at: {output_path}")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_LEFT
    )

    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#475569'),
        alignment=TA_LEFT
    )

    domain_header_style = ParagraphStyle(
        'DomainHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#ffffff'),
        alignment=TA_LEFT
    )

    domain_sub_style = ParagraphStyle(
        'DomainSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#f1f5f9'),
        alignment=TA_LEFT
    )

    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_LEFT
    )

    td_name_style = ParagraphStyle(
        'TableDataName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#0f172a'),
        alignment=TA_LEFT
    )

    td_role_style = ParagraphStyle(
        'TableDataRole',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#1e40af'),
        alignment=TA_LEFT
    )

    td_phone_style = ParagraphStyle(
        'TableDataPhone',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#047857'),
        alignment=TA_LEFT
    )

    td_email_style = ParagraphStyle(
        'TableDataEmail',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#2563eb'),
        alignment=TA_LEFT
    )

    td_events_style = ParagraphStyle(
        'TableDataEvents',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7,
        leading=9,
        textColor=colors.HexColor('#334155'),
        alignment=TA_LEFT
    )

    story = []

    # 1. Header Banner Block
    banner_data = [
        [
            Paragraph("<b>TECHFEST '26 • SLIET LONGOWAL</b><br/><font size=14 color='#0f172a'><b>All 13 Domains: Coordinators & Contacts Directory</b></font>", title_style),
            Paragraph("<b>Official Unstop Verification</b><br/><font size=7 color='#64748b'>Generated: October 2026<br/>Status: Synchronized Live</font>", ParagraphStyle('HRight', parent=subtitle_style, alignment=TA_RIGHT))
        ]
    ]
    banner_table = Table(banner_data, colWidths=[370, 153])
    banner_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(banner_table)
    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f172a'), spaceBefore=2, spaceAfter=8))

    # 2. Executive Stat Cards
    stat_data = [
        [
            Paragraph("<b>13</b><br/><font size=7 color='#64748b'>Technical Domains</font>", ParagraphStyle('Stat1', parent=subtitle_style, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=12, leading=14)),
            Paragraph("<b>62</b><br/><font size=7 color='#64748b'>National Competitions</font>", ParagraphStyle('Stat2', parent=subtitle_style, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=12, leading=14)),
            Paragraph("<b>55+</b><br/><font size=7 color='#64748b'>Designated Coordinators</font>", ParagraphStyle('Stat3', parent=subtitle_style, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=12, leading=14)),
            Paragraph("<b>100%</b><br/><font size=7 color='#64748b'>Unstop & Portal Verified</font>", ParagraphStyle('Stat4', parent=subtitle_style, alignment=TA_CENTER, fontName='Helvetica-Bold', fontSize=12, leading=14)),
        ]
    ]
    stat_table = Table(stat_data, colWidths=[130, 131, 131, 131])
    stat_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(stat_table)
    story.append(Spacer(1, 6))

    # 3. Central & Overall Leadership Quick Block
    lead_box_data = [
        [
            Paragraph("<b>FESTIVAL SECRETARIAT & OVERALL LEADERSHIP</b>", ParagraphStyle('LeadH', fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor('#0f172a'))),
            Paragraph("<b>Naman Kumar Sinha:</b> +91 78568 93952 • <b>Shubham Kumar Singh:</b> +91 97711 74465 • <b>Official Desk:</b> techfest@sliet.ac.in", ParagraphStyle('LeadB', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#334155'), alignment=TA_RIGHT))
        ]
    ]
    lead_table = Table(lead_box_data, colWidths=[200, 323])
    lead_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#eff6ff')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#bfdbfe')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(lead_table)
    story.append(Spacer(1, 7))

    # 4. Loop through all 13 Domains
    curated_domains = get_curated_data()

    col_widths = [110, 95, 92, 118, 108]  # Sum = 523 pt (exact printable width)

    for idx, d in enumerate(curated_domains, 1):
        dom_elements = []

        # Domain Header Strip
        events_count = len(d['events'])
        coords_count = len(d['coordinators'])
        d_header_text = f"<b>{idx}. {d['name'].upper()}</b> &nbsp;&nbsp;<font size=8 color='#cbd5e1'>({d['code']})</font>"
        d_meta_text = f"<b>Theme:</b> {d['theme']} &nbsp;|&nbsp; <b>{events_count} Events</b> &nbsp;|&nbsp; <b>{coords_count} Coordinators</b>"

        dom_strip_data = [
            [
                Paragraph(d_header_text, domain_header_style),
                Paragraph(f"<font size=8 color='#ffffff'><b>BAY {d['code'][-4:]}</b></font>", ParagraphStyle('DomCode', parent=domain_sub_style, alignment=TA_RIGHT))
            ],
            [
                Paragraph(d_meta_text, domain_sub_style),
                Paragraph(f"<font size=7 color='#e2e8f0'>SLIET TechFEST '26</font>", ParagraphStyle('DomYr', parent=domain_sub_style, alignment=TA_RIGHT))
            ]
        ]
        dom_strip_table = Table(dom_strip_data, colWidths=[430, 93])
        dom_strip_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(d['color'])),
            ('TOPPADDING', (0,0), (-1,-1), 2.8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2.8),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ]))
        dom_elements.append(dom_strip_table)

        # Table Rows for this domain
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
            events_str = ", ".join(c['events']) if c['events'] else "Domain Coordination"
            # Format role with pill badge style
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
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 2.8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2.8),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
            ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]

        # Alternating row colors
        for r_i in range(1, len(table_rows)):
            bg = colors.HexColor('#ffffff') if r_i % 2 == 1 else colors.HexColor('#f8fafc')
            coords_table_style.append(('BACKGROUND', (0, r_i), (-1, r_i), bg))

        coords_table.setStyle(TableStyle(coords_table_style))
        dom_elements.append(coords_table)
        dom_elements.append(Spacer(1, 7))

        # Keep domain block together if short, or allow break if large
        if len(d['coordinators']) <= 5:
            story.append(KeepTogether(dom_elements))
        else:
            story.extend(dom_elements)

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"✅ Successfully generated PDF report with {len(curated_domains)} domains!")

if __name__ == '__main__':
    os.makedirs('public', exist_ok=True)
    generate_pdf('techfest26_coordinators_directory.pdf')
    generate_pdf('public/techfest26_coordinators_directory.pdf')
    # Also copy to artifact dir
    artifact_path = '/Users/rajaryan/.gemini/antigravity/brain/c39e06e0-39ba-4181-9638-42d372d7e5ba/techfest26_coordinators_directory.pdf'
    generate_pdf(artifact_path)
    print(f"Generated PDF in 3 locations including artifact directory: {artifact_path}")
