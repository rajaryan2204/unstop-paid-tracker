// src/utils/auth.js
// TechFEST '26 Role-Based Access Control (RBAC), 13 Domains Directory & Official Logins
import { 
  fetchCustomPasswordsFromNeon, 
  writeCustomPasswordToNeon, 
  deleteCustomPasswordFromNeon 
} from './neonDb';
import { recordLoginSession } from './device';

export const DOMAINS_DIRECTORY = {
  robozar: {
    id: 'robozar',
    name: 'RoboZar',
    bay: 'BAY-RZ01',
    category: 'Robotics & Combat',
    department: 'Robotics & Automation',
    tagline: 'Full-Contact Mecha Battles, Drones & Autonomous Navigation',
    accentColor: '#38BDF8',
    events: [
      'Robowar',
      'Rapid Line',
      'Rapid Line (LFR)',
      'Sky Maneuver',
      'Hovermania',
      'RoboSoccer',
      'RC Boat',
      'RC Car',
      'Micromouse Challenge'
    ]
  },
  plexus: {
    id: 'plexus',
    name: 'Plexus',
    bay: 'BAY-PX02',
    category: 'Computer Science & AI',
    department: 'Computer Science & Engineering',
    tagline: 'Competitive Coding, AI Systems, Reverse Engineering & Web Sprints',
    accentColor: '#818CF8',
    events: [
      'Competitive Programming Marathon',
      'Ghost Code',
      'Pixel Wizard',
      'Machine Learning Model',
      'The Neural Nexus',
      'Debug and Deploy',
      'Debug & Deploy',
      'AI Chit-Chat',
      'Heuristic Havoc',
      'Logic Flow'
    ]
  },
  karyarachna: {
    id: 'karyarachna',
    name: 'Karyarachna',
    bay: 'BAY-KR03',
    category: 'Innovation & Prototyping',
    department: 'Innovation & Incubation Hub',
    tagline: 'Circular Prototyping, 36h Hackathon & Sustainable Jugaad',
    accentColor: '#C084FC',
    events: [
      'Kritrim - Model Exhibition',
      'Hackathon',
      'Jugaad'
    ]
  },
  kermis: {
    id: 'kermis',
    name: 'Kermis',
    bay: 'BAY-KM04',
    category: 'Esports & Strategy',
    department: 'Digital Gaming & Mind Sports',
    tagline: 'Battle Royale Esports (BGMI, Free Fire) & Rapid Chess League',
    accentColor: '#F472B6',
    events: [
      'BGMI',
      'Free Fire',
      'Chess'
    ]
  },
  genesis: {
    id: 'genesis',
    name: 'Genesis',
    bay: 'BAY-GN05',
    category: 'Business & Startups',
    department: 'Management & Entrepreneurship',
    tagline: 'Venture Pitches, Case Cracks, Brand Marketing & ESG Strategy',
    accentColor: '#FBBF24',
    events: [
      'Pitchverse',
      'Pitchverse - Virtual Strategy',
      'Case Crack',
      'Brand Blitz',
      'Case Ethical Crosstalk'
    ]
  },
  electronica: {
    id: 'electronica',
    name: 'Electronica',
    bay: 'BAY-EC06',
    category: 'Electronics & IoT',
    department: 'Electronics & Communication Engineering',
    tagline: 'Micro-Power Silicon, IoT Sensors & Hardware Prototyping',
    accentColor: '#34D399',
    events: [
      'Circuit Craft',
      'Digital Design Challenge',
      'Innovation-X',
      'Arduino Imagino'
    ]
  },
  electrica: {
    id: 'electrica',
    name: 'Electrica',
    bay: 'BAY-EL07',
    category: 'Electrical & Energy',
    department: 'Electrical & Instrumentation Engineering',
    tagline: 'Net-Zero Power Grids, Soldering Speedruns & Wireless Power Transfer',
    accentColor: '#F59E0B',
    events: [
      'Soldering Speedrun',
      'Breadboard Battle',
      'Grid Masters-SLD Challenge',
      'Grid Masters - SLD Challenge',
      'WPTC - Wireless Power Transfer'
    ]
  },
  mechanica: {
    id: 'mechanica',
    name: 'Mechanica',
    bay: 'BAY-MC08',
    category: 'Mechanical Engineering',
    department: 'Mechanical Engineering & Fabrication',
    tagline: 'Precision 3D CAD Modeling, High-Load Hydraulics & Mechnovate',
    accentColor: '#FB923C',
    events: [
      'Mechnovate',
      'Designare',
      'Hydraload',
      'Fabriquer'
    ]
  },
  chemica: {
    id: 'chemica',
    name: 'Chemica',
    bay: 'BAY-CH09',
    category: 'Chemical Technology',
    department: 'Chemical Engineering & Bio-Polymers',
    tagline: 'Green Bio-Polymers, Chemi-Thon, Soap Formulations & Analytical Mystery',
    accentColor: '#A78BFA',
    events: [
      'Chemi-Thone',
      'Soap Making',
      'Jam Session',
      'Chemi-Mystery',
      'Chemi Craft',
      'Poster and Paper Presentation'
    ]
  },
  civicon: {
    id: 'civicon',
    name: 'Civicon',
    bay: 'BAY-CV10',
    category: 'Civil & Smart Cities',
    department: 'Civil Engineering & Infrastructure',
    tagline: 'Net-Zero Architecture, Truss Analysis, City Modeling & Seismic Design',
    accentColor: '#2DD4BF',
    events: [
      'Truss Load',
      'City Model Exhibition',
      'Seismic Challenge',
      'CAD Design Challenge',
      'Technical Quiz Competition',
      'Poster Presentation'
    ]
  },
  inventia: {
    id: 'inventia',
    name: 'Inventia',
    bay: 'BAY-IN11',
    category: 'Interdisciplinary Innovation',
    department: 'Sciences & Interdisciplinary Technologies',
    tagline: 'Cross-Disciplinary Earth Solutions, Smart Agriculture & Techno-Vation',
    accentColor: '#4ADE80',
    events: [
      'Techno-Vation',
      'Smart Agriculture (SM-Agri)',
      'SM-Agri',
      'Cognitive Challenges'
    ]
  },
  foodocrats: {
    id: 'foodocrats',
    name: 'Food-O-Crats',
    bay: 'BAY-FC12',
    category: 'Food Tech & Agriculture',
    department: 'Food Engineering & Precision Nutrition',
    tagline: 'Precision Food Preservation, Nutritional Forensics & Foodprint',
    accentColor: '#E879F9',
    events: [
      'Food Forge',
      'Food Forensics',
      'Clue Craze',
      'Foodprint',
      'Tech4Earth'
    ]
  },
  atomheimer: {
    id: 'atomheimer',
    name: 'Atomheimer',
    bay: 'BAY-AT13',
    category: 'Applied Sciences & Physics',
    department: 'Physics, Chemistry & Applied Sciences',
    tagline: 'Financial Modeling (The Big Bull), Aqua Aerodynamics & Science Quizzes',
    accentColor: '#60A5FA',
    events: [
      'The Big Bull',
      'The Big Bull (Diploma Students Only)',
      'Aqua Clean',
      'The Aqua-Epoch',
      'Splash Rocket',
      'Aerostrike',
      'Quiz Nova'
    ]
  }
};

// OFFICIAL ACCOUNTS (2 Admins + 13 Domain Heads + 1 Combined Calling Desk)
export const OFFICIAL_ACCOUNTS = [
  // 1 & 2: Central Super Admins
  {
    username: 'raj',
    defaultPassword: 'raj@sliet',
    name: 'Raj Aryan',
    role: 'super_admin',
    accountType: 'admin',
    team: 'central',
    teamName: 'Central Desk',
    title: 'Central Tech & Operations Lead',
    domainId: null,
    avatar: 'RA',
    description: 'Master access across all 13 domains, 62 events, calling logs & audit trails.'
  },
  {
    username: 'sagar',
    defaultPassword: 'sagar@sliet',
    name: 'Sagar Anmol',
    role: 'super_admin',
    accountType: 'admin',
    team: 'central',
    teamName: 'Central Desk',
    title: 'Lead Organizer & Central Desk Head',
    domainId: null,
    avatar: 'SA',
    description: 'Master organizer access across all registrations, calling teams, and gateway verifications.'
  },

  // 3-15: 13 Domain Heads
  {
    username: 'plexus',
    defaultPassword: 'plexus@sliet',
    name: 'Plexus Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'plexus',
    domainName: 'Plexus',
    bay: 'BAY-PX02',
    team: 'plexus',
    teamName: 'Plexus Domain',
    title: 'Head of Computer Science & AI Domain',
    avatar: 'PX'
  },
  {
    username: 'mechanica',
    defaultPassword: 'mechanica@sliet',
    name: 'Mechanica Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'mechanica',
    domainName: 'Mechanica',
    bay: 'BAY-MC08',
    team: 'mechanica',
    teamName: 'Mechanica Domain',
    title: 'Head of Mechanical & Fabrication Domain',
    avatar: 'MC'
  },
  {
    username: 'robozar',
    defaultPassword: 'robozar@sliet',
    name: 'RoboZar Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'robozar',
    domainName: 'RoboZar',
    bay: 'BAY-RZ01',
    team: 'robozar',
    teamName: 'RoboZar Domain',
    title: 'Head of Robotics & Combat Domain',
    avatar: 'RZ'
  },
  {
    username: 'karyarachna',
    defaultPassword: 'karyarachna@sliet',
    name: 'Karyarachna Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'karyarachna',
    domainName: 'Karyarachna',
    bay: 'BAY-KR03',
    team: 'karyarachna',
    teamName: 'Karyarachna Domain',
    title: 'Head of Innovation & Hackathon Domain',
    avatar: 'KR'
  },
  {
    username: 'kermis',
    defaultPassword: 'kermis@sliet',
    name: 'Kermis Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'kermis',
    domainName: 'Kermis',
    bay: 'BAY-KM04',
    team: 'kermis',
    teamName: 'Kermis Domain',
    title: 'Head of Esports & Gaming League',
    avatar: 'KM'
  },
  {
    username: 'genesis',
    defaultPassword: 'genesis@sliet',
    name: 'Genesis Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'genesis',
    domainName: 'Genesis',
    bay: 'BAY-GN05',
    team: 'genesis',
    teamName: 'Genesis Domain',
    title: 'Head of Business & Startup Incubator',
    avatar: 'GN'
  },
  {
    username: 'electronica',
    defaultPassword: 'electronica@sliet',
    name: 'Electronica Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'electronica',
    domainName: 'Electronica',
    bay: 'BAY-EC06',
    team: 'electronica',
    teamName: 'Electronica Domain',
    title: 'Head of Electronics & IoT Arena',
    avatar: 'EC'
  },
  {
    username: 'electrica',
    defaultPassword: 'electrica@sliet',
    name: 'Electrica Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'electrica',
    domainName: 'Electrica',
    bay: 'BAY-EL07',
    team: 'electrica',
    teamName: 'Electrica Domain',
    title: 'Head of Electrical & Clean Energy Domain',
    avatar: 'EL'
  },
  {
    username: 'chemica',
    defaultPassword: 'chemica@sliet',
    name: 'Chemica Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'chemica',
    domainName: 'Chemica',
    bay: 'BAY-CH09',
    team: 'chemica',
    teamName: 'Chemica Domain',
    title: 'Head of Chemical & Bio-Polymer Domain',
    avatar: 'CH'
  },
  {
    username: 'civicon',
    defaultPassword: 'civicon@sliet',
    name: 'Civicon Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'civicon',
    domainName: 'Civicon',
    bay: 'BAY-CV10',
    team: 'civicon',
    teamName: 'Civicon Domain',
    title: 'Head of Civil & Smart Architecture Domain',
    avatar: 'CV'
  },
  {
    username: 'inventia',
    defaultPassword: 'inventia@sliet',
    name: 'Inventia Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'inventia',
    domainName: 'Inventia',
    bay: 'BAY-IN11',
    team: 'inventia',
    teamName: 'Inventia Domain',
    title: 'Head of Interdisciplinary Solutions Domain',
    avatar: 'IN'
  },
  {
    username: 'foodocrats',
    defaultPassword: 'foodocrats@sliet',
    aliasUsername: 'food-o-crats',
    name: 'Food-O-Crats Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'foodocrats',
    domainName: 'Food-O-Crats',
    bay: 'BAY-FC12',
    team: 'foodocrats',
    teamName: 'Food-O-Crats Domain',
    title: 'Head of Food Engineering & Agri Domain',
    avatar: 'FC'
  },
  {
    username: 'atomheimer',
    defaultPassword: 'atomheimer@sliet',
    name: 'Atomheimer Domain Head',
    role: 'domain_head',
    accountType: 'domain',
    domainId: 'atomheimer',
    domainName: 'Atomheimer',
    bay: 'BAY-AT13',
    team: 'atomheimer',
    teamName: 'Atomheimer Domain',
    title: 'Head of Applied Sciences & Physics Domain',
    avatar: 'AT'
  },

  // 16: Combined Reception & Outreach Desk (As requested by user)
  {
    username: 'outreach',
    aliasUsername: 'reception',
    defaultPassword: 'outreach@sliet',
    name: 'Reception & Outreach Calling Desk',
    role: 'operations_calling',
    accountType: 'operations',
    team: 'outreach',
    teamName: 'Reception & Outreach Team',
    title: 'Participant Calling & Spot Registration Desk',
    domainId: null,
    avatar: 'RO',
    description: 'Unified front-desk reception and outbound calling operations across all events.'
  }
];

const SESSION_STORAGE_KEY = 'tf_auth_session_v4';
const CUSTOM_PASSWORDS_KEY = 'tf_custom_passwords_v2';

export function getCustomPasswords() {
  try {
    const raw = localStorage.getItem(CUSTOM_PASSWORDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading custom passwords:', e);
  }
  return {};
}

export function saveCustomPasswords(passwords) {
  try {
    localStorage.setItem(CUSTOM_PASSWORDS_KEY, JSON.stringify(passwords));
  } catch (e) {
    console.error('Error saving custom passwords:', e);
  }
}

export function getPasswordForAccount(username) {
  const custom = getCustomPasswords();
  const clean = username.toLowerCase().trim();
  if (custom[clean]) return custom[clean];

  const acc = OFFICIAL_ACCOUNTS.find(a => 
    a.username.toLowerCase() === clean || 
    (a.aliasUsername && a.aliasUsername.toLowerCase() === clean)
  );

  return acc?.defaultPassword || `${clean}@sliet`;
}

/**
 * Sync custom passwords from Neon PostgreSQL
 */
export async function syncPasswordsWithNeon() {
  try {
    const cloudPasswords = await fetchCustomPasswordsFromNeon();
    if (cloudPasswords && Object.keys(cloudPasswords).length > 0) {
      const local = getCustomPasswords();
      const merged = { ...local, ...cloudPasswords };
      saveCustomPasswords(merged);
    }
  } catch (err) {
    console.error('Error syncing passwords with Neon:', err);
  }
}

/**
 * Super Admin Password Reset Tool
 * Allows Raj and Sagar to change/reset passwords for any account
 */
export function setAccountPassword(adminUser, targetUsername, newPassword) {
  if (!adminUser || adminUser.role !== 'super_admin') {
    throw new Error('Unauthorized: Only Super Admins (Raj & Sagar) can reset passwords.');
  }
  if (!targetUsername || !newPassword || newPassword.trim().length < 4) {
    throw new Error('Password must be at least 4 characters long.');
  }

  const clean = targetUsername.toLowerCase().trim();
  const custom = getCustomPasswords();
  custom[clean] = newPassword.trim();
  saveCustomPasswords(custom);

  // Background Cloud Sync to Neon PostgreSQL
  writeCustomPasswordToNeon(clean, newPassword.trim(), adminUser.username)
    .catch(e => console.error('Neon writeCustomPassword error:', e));

  return true;
}

export function resetAccountPasswordToDefault(adminUser, targetUsername) {
  if (!adminUser || adminUser.role !== 'super_admin') {
    throw new Error('Unauthorized: Only Super Admins can reset passwords.');
  }
  const clean = targetUsername.toLowerCase().trim();
  const custom = getCustomPasswords();
  delete custom[clean];
  saveCustomPasswords(custom);

  // Background Cloud Delete in Neon PostgreSQL
  deleteCustomPasswordFromNeon(clean)
    .catch(e => console.error('Neon deleteCustomPassword error:', e));

  return true;
}

export function getActiveUser() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username) return parsed;
    }
  } catch (e) {
    console.error('Error reading auth session:', e);
  }
  // Return null when not logged in (so Login Screen appears on visit!)
  return null;
}

export function setActiveUser(user) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    if (user) {
      recordLoginSession(user);
    }
  } catch (e) {
    console.error('Error saving auth session:', e);
  }
}

export function clearActiveUser() {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing auth session:', e);
  }
}

/**
 * Authenticates user credentials against the official accounts and custom passwords.
 */
export function authenticateUser(usernameInput, passwordInput) {
  if (!usernameInput || !passwordInput) {
    return { success: false, error: 'Please enter both username and password.' };
  }

  const cleanUser = usernameInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  const account = OFFICIAL_ACCOUNTS.find(acc => 
    acc.username.toLowerCase() === cleanUser || 
    (acc.aliasUsername && acc.aliasUsername.toLowerCase() === cleanUser)
  );

  if (!account) {
    return { 
      success: false, 
      error: `Account "${cleanUser}" not found. Enter your assigned domain ID (e.g. plexus, mechanica), admin ID, or outreach.` 
    };
  }

  const expectedPassword = getPasswordForAccount(account.username);

  // For outreach, also accept reception@sliet
  const isMatch = (cleanPass === expectedPassword) || 
                  (account.username === 'outreach' && cleanPass === 'reception@sliet');

  if (!isMatch) {
    return { 
      success: false, 
      error: `Incorrect password for ${account.name}. Contact Central Desk (Raj / Sagar) if forgotten.` 
    };
  }

  return { success: true, user: account };
}

/**
 * Checks if a specific event belongs to a domain
 */
export function isEventInDomain(domainId, eventName) {
  if (!domainId || !eventName) return false;
  const domain = DOMAINS_DIRECTORY[domainId];
  if (!domain) return false;

  const target = eventName.toLowerCase().trim();
  return domain.events.some(ev => {
    const evLower = ev.toLowerCase().trim();
    return target === evLower || target.includes(evLower) || evLower.includes(target);
  });
}

/**
 * Resolves which domain an event belongs to (or null)
 */
export function getDomainForEvent(eventName) {
  if (!eventName) return null;
  const target = eventName.toLowerCase().trim();

  for (const [dId, dInfo] of Object.entries(DOMAINS_DIRECTORY)) {
    const match = dInfo.events.some(ev => {
      const evLower = ev.toLowerCase().trim();
      return target === evLower || target.includes(evLower) || evLower.includes(target);
    });
    if (match) return dInfo;
  }
  return null;
}

/**
 * Filters participants for the active user session.
 */
export function getParticipantsForUser(user, participants = [], domainOverride = null) {
  if (!Array.isArray(participants)) return [];
  if (!user) return [];

  const targetDomainId = user.role === 'domain_head' ? user.domainId : domainOverride;

  if (targetDomainId && targetDomainId !== 'ALL') {
    return participants.filter(p => isEventInDomain(targetDomainId, p.event_name));
  }

  return participants;
}

/**
 * Computes domain-specific statistical metrics
 */
export function getDomainStats(domainId, participants = []) {
  const domain = DOMAINS_DIRECTORY[domainId];
  if (!domain) return null;

  const domainParticipants = participants.filter(p => isEventInDomain(domainId, p.event_name));
  const paidCount = domainParticipants.filter(p => Number(p.amount) > 0).length;
  const totalRevenue = domainParticipants.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const colleges = new Set(domainParticipants.map(p => p.college).filter(Boolean));

  return {
    domain,
    totalParticipants: domainParticipants.length,
    paidCount,
    freeCount: domainParticipants.length - paidCount,
    totalRevenue,
    uniqueColleges: colleges.size,
    eventsCount: domain.events.length,
    eventsList: domain.events
  };
}
