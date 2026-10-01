import json

with open('data/all_domains_coordinators.json') as f:
    raw = json.load(f)

# Domain mapping details
domain_metadata = [
    {
        'id': 'robozar',
        'name': 'RoboZar',
        'code': 'BAY-RZ01',
        'theme': 'Robotics, Combat & Autonomous Systems',
        'color': '#0284c7' # Cyan/Sky
    },
    {
        'id': 'plexus',
        'name': 'Plexus',
        'code': 'BAY-PX02',
        'theme': 'Computer Science, AI & Competitive Programming',
        'color': '#2563eb' # Blue
    },
    {
        'id': 'karyarachna',
        'name': 'Karyarachna',
        'code': 'BAY-KR03',
        'theme': 'Hardware Prototyping, Innovation & Hackathon',
        'color': '#7c3aed' # Purple
    },
    {
        'id': 'kermis',
        'name': 'Kermis',
        'code': 'BAY-KM04',
        'theme': 'Esports League & Strategic Gaming',
        'color': '#dc2626' # Red
    },
    {
        'id': 'genesis',
        'name': 'Genesis',
        'code': 'BAY-GN05',
        'theme': 'Business Strategy, Case Studies & Product Marketing',
        'color': '#d97706' # Amber
    },
    {
        'id': 'electronica',
        'name': 'Electronica',
        'code': 'BAY-EC06',
        'theme': 'Embedded Systems, IoT & Circuit Design',
        'color': '#0d9488' # Teal
    },
    {
        'id': 'electrica',
        'name': 'Electrica',
        'code': 'BAY-EL07',
        'theme': 'Power Systems, Prototyping & Electrical Engineering',
        'color': '#ea580c' # Orange
    },
    {
        'id': 'mechanica',
        'name': 'Mechanica',
        'code': 'BAY-MC08',
        'theme': 'Mechanical Fabrication, 3D CAD & Fluid Dynamics',
        'color': '#475569' # Slate
    },
    {
        'id': 'chemica',
        'name': 'Chemica',
        'code': 'BAY-CH09',
        'theme': 'Chemical Engineering, Formulations & Process Analysis',
        'color': '#059669' # Emerald
    },
    {
        'id': 'civicon',
        'name': 'Civicon',
        'code': 'BAY-CV10',
        'theme': 'Structural Engineering, CAD Modeling & Infrastructure',
        'color': '#ca8a04' # Yellow/Gold
    },
    {
        'id': 'inventia',
        'name': 'Inventia',
        'code': 'BAY-IN11',
        'theme': 'Smart Agritech, Techno-Vation & Cognitive Problem Solving',
        'color': '#16a34a' # Green
    },
    {
        'id': 'foodocrats',
        'name': 'Food-O-Crats',
        'code': 'BAY-FC12',
        'theme': 'Food Technology, Sensory Analysis & Sustainable Systems',
        'color': '#e11d48' # Rose
    },
    {
        'id': 'atomheimer',
        'name': 'Atomheimer',
        'code': 'BAY-AT13',
        'theme': 'Applied Sciences, Aerospace, Finance & Hydro-Dynamics',
        'color': '#4f46e5' # Indigo
    }
]

print("Loaded metadata for all 13 domains.")
