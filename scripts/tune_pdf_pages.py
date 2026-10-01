import re

with open('scripts/generate_coordinators_pdf.py') as f:
    code = f.read()

# Make minor tuning to paddings and spacers
code = code.replace("topMargin=46,", "topMargin=36,")
code = code.replace("bottomMargin=46", "bottomMargin=36")
code = code.replace("Spacer(1, 11)", "Spacer(1, 7)")
code = code.replace("Spacer(1, 12)", "Spacer(1, 7)")
code = code.replace("Spacer(1, 10)", "Spacer(1, 6)")
code = code.replace("('TOPPADDING', (0,0), (-1,-1), 4),", "('TOPPADDING', (0,0), (-1,-1), 2.8),")
code = code.replace("('BOTTOMPADDING', (0,0), (-1,-1), 4),", "('BOTTOMPADDING', (0,0), (-1,-1), 2.8),")

with open('scripts/generate_coordinators_pdf.py', 'w') as f:
    f.write(code)

