import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas

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
        self.setFont("Helvetica-Bold", 7.5)
        self.setFillColor(colors.HexColor("#475569"))
        
        # Header line
        self.drawString(24, 822, "TECHFEST '26 SLIET LONGOWAL • DOMAIN COORDINATORS OFFICIAL CREDENTIALS")
        self.drawRightString(A4[0] - 24, 822, "STRICTLY CONFIDENTIAL / RESTRICTED")
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(24, 816, A4[0] - 24, 816)

        # Footer line
        self.setFont("Helvetica", 7)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(24, 16, "Central Operations Command Desk • Sant Longowal Institute of Engineering & Technology (SLIET) • techfest@sliet.ac.in")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 24, 16, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(24, 24, A4[0] - 24, 24)
        
        self.restoreState()

def generate_credentials_pdf(output_path):
    print(f"Generating Domain Credentials PDF at: {output_path}")
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=24,
        rightMargin=24,
        topMargin=32,
        bottomMargin=30
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=colors.HexColor('#0F172A')
    )

    subtitle_style = ParagraphStyle(
        'SubTitleStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor('#475569')
    )

    domain_roster = [
        {
            "id": 1,
            "domain": "ROBOZAR",
            "bay": "BAY-RZ01",
            "name": "Nayan Kumar",
            "email": "nayan98351@gmail.com",
            "phone": "+91 98351 90210",
            "color": "#0284C7",
            "events": "8 Events (Robowar, RC Boat, RoboSoccer, etc.)"
        },
        {
            "id": 2,
            "domain": "PLEXUS",
            "bay": "BAY-PX02",
            "name": "Sumit Bansal",
            "email": "sumitbansal1290@gmail.com",
            "phone": "+91 73404 35001",
            "color": "#2563EB",
            "events": "6 Events (Pixel Wizard, Ghost Code, etc.)"
        },
        {
            "id": 3,
            "domain": "CIVICON",
            "bay": "BAY-CV10",
            "name": "ANIL KUMAWAT",
            "email": "anilkumawat01612@gmail.com",
            "phone": "+91 93510 50693",
            "color": "#B45309",
            "events": "6 Events (Truss Load, City Model, etc.)"
        },
        {
            "id": 4,
            "domain": "CHEMICA",
            "bay": "BAY-CH09",
            "name": "Amit Kumar",
            "email": "let.mail.amit@gmail.com",
            "phone": "+91 80100 64068",
            "color": "#059669",
            "events": "6 Events (Chemi-Thone, Soap Making, etc.)"
        },
        {
            "id": 5,
            "domain": "FOOD-O-CRATS",
            "bay": "BAY-FC12",
            "name": "Granthick Sarkar",
            "email": "granthicksarkar@gmail.com",
            "phone": "+91 62804 26074",
            "color": "#E11D48",
            "events": "5 Events (Food Forge, Clue Craze, etc.)"
        },
        {
            "id": 6,
            "domain": "ATOMHEIMER",
            "bay": "BAY-AT13",
            "name": "Aisha Kumari",
            "email": "aishakumariabm@gmail.com",
            "phone": "+91 62096 81064",
            "color": "#4F46E5",
            "events": "6 Events (The Big Bull, Aqua-Epoch, etc.)"
        },
        {
            "id": 7,
            "domain": "ELECTRICA",
            "bay": "BAY-EL07",
            "name": "Pawan Tanay",
            "email": "pawantanay01@gmail.com",
            "phone": "+91 94858 20012",
            "color": "#EA580C",
            "events": "4 Events (Soldering Speedrun, WPTC, etc.)"
        },
        {
            "id": 8,
            "domain": "MECHANICA",
            "bay": "BAY-MC08",
            "name": "Aditya Raj",
            "email": "adityaz754934@gmail.com",
            "phone": "+91 78568 93952",
            "color": "#475569",
            "events": "4 Events (Mechnovate, Designare, etc.)"
        },
        {
            "id": 9,
            "domain": "ELECTRONICA",
            "bay": "BAY-EC06",
            "name": "Anupam Kumar",
            "email": "anupamlashkari852220@gmail.com",
            "phone": "+91 88094 46009",
            "color": "#0D9488",
            "events": "4 Events (Circuit Craft, Innovation-X, etc.)"
        },
        {
            "id": 10,
            "domain": "KARYARACHNA",
            "bay": "BAY-KR03",
            "name": "PRITAM BARMAN",
            "email": "pritambarman642@gmail.com",
            "phone": "+91 81010 52034",
            "color": "#7C3AED",
            "events": "3 Events (36h Hackathon, Jugaad, Kritrim)"
        },
        {
            "id": 11,
            "domain": "KERMIS",
            "bay": "BAY-KM04",
            "name": "Apurv Raj",
            "email": "apurv6736@gmail.com",
            "phone": "+91 74882 33310",
            "color": "#DC2626",
            "events": "3 Events (BGMI, Free Fire, Chess)"
        },
        {
            "id": 12,
            "domain": "INVENTIA",
            "bay": "BAY-IN11",
            "name": "Tarun Lalwani",
            "email": "tarunishere0@gmail.com",
            "phone": "+91 82335 23098",
            "color": "#16A34A",
            "events": "3 Events (Techno-Vation, SM-Agri, etc.)"
        },
        {
            "id": 13,
            "domain": "GENESIS",
            "bay": "BAY-GN05",
            "name": "Aditya Kumar Gupta",
            "email": "adityafb7399@gmail.com",
            "phone": "+91 73996 45983",
            "color": "#D97706",
            "events": "4 Events (Pitchverse, Case Crack, Blitz)"
        }
    ]

    story = []

    # 1. Header Banner
    header_data = [
        [
            Paragraph("<b>TECHFEST '26 • SLIET LONGOWAL</b><br/><font size=11 color='#0F172A'><b>Domain Coordinators: Official Login Credentials</b></font>", title_style),
            Paragraph("<b>Portal Credentials Directory</b><br/><font size=6.5 color='#64748B'>Status: Live Active Roster<br/>Scope: 13 Technical Domains Only</font>", ParagraphStyle('HRight', parent=subtitle_style, alignment=TA_RIGHT))
        ]
    ]
    # Printable width = 595.27 - 48 = 547.27 pt
    header_table = Table(header_data, colWidths=[380, 167])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(header_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.2, color=colors.HexColor('#0F172A'), spaceBefore=1, spaceAfter=5))

    # 2. Mandatory Security Protocol Notice Box
    notice_text = (
        "<b>MANDATORY FIRST-LOGIN SECURITY PROTOCOL:</b><br/>"
        "• <b>Default Initial Password:</b> All domain coordinators have been provisioned with the initial password <b><font color='#047857'>Techfest@2026</font></b>.<br/>"
        "• <b>Immediate Password Change:</b> As soon as you log in, you will be prompted to set your personal confidential password. Please change it immediately.<br/>"
        "• <b>Access Boundary:</b> Each domain lead has exclusive access to their domain's attendee records, calling desk logs, and participant verification.<br/>"
        "• <i>Notice: Central leadership, developer, and administrative accounts are strictly excluded from this domain distribution sheet.</i>"
    )
    notice_table = Table([[Paragraph(notice_text, ParagraphStyle('Notice', fontName='Helvetica', fontSize=7.5, leading=10, textColor=colors.HexColor('#1E293B')))]], colWidths=[547])
    notice_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FEF3C7')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#F59E0B')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    story.append(notice_table)
    story.append(Spacer(1, 6))

    # 3. Master Table of All 13 Domains
    # 20 + 82 + 56 + 92 + 152 + 75 + 70 = 547 pt
    col_widths = [20, 82, 56, 92, 152, 75, 70]

    th_center = ParagraphStyle('THC', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#0F172A'), alignment=TA_CENTER)
    th_left = ParagraphStyle('THL', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#0F172A'), alignment=TA_LEFT)
    th_pass = ParagraphStyle('THP', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#065F46'), alignment=TA_CENTER)

    table_data = [
        [
            Paragraph("<b>#</b>", th_center),
            Paragraph("<b>Domain Name</b>", th_left),
            Paragraph("<b>Bay Code</b>", th_center),
            Paragraph("<b>Designated Lead</b>", th_left),
            Paragraph("<b>Official Login Email (Username)</b>", th_left),
            Paragraph("<b>Initial Password</b>", th_pass),
            Paragraph("<b>Contact Phone</b>", th_left),
        ]
    ]

    for d in domain_roster:
        c_dom = Paragraph(f"<b>{d['domain']}</b>", ParagraphStyle('DName', fontName='Helvetica-Bold', fontSize=7.5, leading=9.5, textColor=colors.HexColor(d['color'])))
        c_bay = Paragraph(f"<b>{d['bay']}</b>", ParagraphStyle('DBay', fontName='Helvetica-Bold', fontSize=7, leading=9, alignment=TA_CENTER, textColor=colors.HexColor('#334155')))
        c_lead = Paragraph(f"<b>{d['name']}</b>", ParagraphStyle('DLead', fontName='Helvetica', fontSize=7.5, leading=9.5, textColor=colors.HexColor('#0F172A')))
        c_email = Paragraph(f"<font color='#1E40AF'><b>{d['email']}</b></font>", ParagraphStyle('DEmail', fontName='Helvetica-Bold', fontSize=7, leading=9, textColor=colors.HexColor('#1E40AF')))
        c_pass = Paragraph("<b>Techfest@2026</b>", ParagraphStyle('DPass', fontName='Helvetica-Bold', fontSize=7, leading=9, alignment=TA_CENTER, textColor=colors.HexColor('#047857')))
        c_phone = Paragraph(d['phone'], ParagraphStyle('DPhone', fontName='Helvetica', fontSize=7, leading=9, textColor=colors.HexColor('#334155')))

        table_data.append([
            Paragraph(f"<b>{d['id']}</b>", ParagraphStyle('DId', fontName='Helvetica-Bold', fontSize=7, leading=9, alignment=TA_CENTER, textColor=colors.HexColor('#64748B'))),
            c_dom,
            c_bay,
            c_lead,
            c_email,
            c_pass,
            c_phone
        ])

    table = Table(table_data, colWidths=col_widths)
    t_style = [
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#E2E8F0')),
        ('BACKGROUND', (5,0), (5,0), colors.HexColor('#CCFBF1')),
        ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]

    for r_idx in range(1, len(table_data)):
        bg = colors.HexColor('#FFFFFF') if r_idx % 2 == 1 else colors.HexColor('#F8FAFC')
        t_style.append(('BACKGROUND', (0, r_idx), (-1, r_idx), bg))
        # Highlight initial password column with soft green
        t_style.append(('BACKGROUND', (5, r_idx), (5, r_idx), colors.HexColor('#ECFDF5')))

    table.setStyle(TableStyle(t_style))
    story.append(table)
    story.append(Spacer(1, 8))

    # 4. Quick How-To Access Guide (Bottom Strip)
    guide_data = [
        [
            Paragraph("<b>STEP 1: ACCESS PORTAL</b><br/><font size=6.5 color='#475569'>Open techFEST '26 Operations Portal in your mobile or desktop browser.</font>", ParagraphStyle('G1', fontName='Helvetica', fontSize=7, leading=9)),
            Paragraph("<b>STEP 2: SIGN IN</b><br/><font size=6.5 color='#475569'>Enter your official coordinator email and default password: <b>Techfest@2026</b>.</font>", ParagraphStyle('G2', fontName='Helvetica', fontSize=7, leading=9)),
            Paragraph("<b>STEP 3: CHANGE PASSWORD</b><br/><font size=6.5 color='#475569'>Set your personal secure password upon initial login to safeguard attendee records.</font>", ParagraphStyle('G3', fontName='Helvetica', fontSize=7, leading=9)),
        ]
    ]
    guide_table = Table(guide_data, colWidths=[182, 183, 182])
    guide_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(guide_table)

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated Domain Credentials PDF at: {output_path}")

if __name__ == '__main__':
    base_dir = '/Users/rajaryan/.gemini/antigravity/scratch/unstop-paid-tracker'
    out_pdf = f'{base_dir}/TechFEST26_Domain_Credentials.pdf'
    generate_credentials_pdf(out_pdf)
    print("Done generating Domain Credentials PDF!")
