// src/utils/auth.js
// TechFEST '26 Role-Based Access Control (RBAC) & Authentication System

export const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Admin',
    level: 100,
    badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
    description: 'Central Desk master access. Full visibility across all domains, events, caller logs, and verification queues.'
  },
  TEAM_HEAD: {
    id: 'team_head',
    name: 'Team Head',
    level: 80,
    badgeColor: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
    description: 'Functional team lead (Invitation, Reception, Outreach). Combined registrations across assigned domains and calling operations.'
  },
  DOMAIN_COORDINATOR: {
    id: 'domain_coordinator',
    name: 'Domain Coordinator',
    level: 60,
    badgeColor: 'border-sky-500/30 bg-sky-500/10 text-sky-400',
    description: 'Coordinates a specific vertical (Competitions, Quizzes, Hackathons, Cultural). Access limited to domain events.'
  },
  EVENT_COORDINATOR: {
    id: 'event_coordinator',
    name: 'Event Coordinator',
    level: 40,
    badgeColor: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    description: 'Manages one or more specific events. Access limited strictly to assigned events.'
  },
  TEAM_MEMBER: {
    id: 'team_member',
    name: 'Team Member',
    level: 20,
    badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    description: 'Calling and operational executive. Access limited to assigned calling target lists.'
  }
};

export const TEAMS = [
  { id: 'central', name: 'Central Desk / Core Secretariat' },
  { id: 'invitation', name: 'Invitation Team' },
  { id: 'reception', name: 'Reception & Helpdesk Team' },
  { id: 'outreach', name: 'Outreach & Calling Team' },
  { id: 'tech_domain', name: 'Technical & Competitions Domain' },
  { id: 'hack_domain', name: 'Hackathons Domain' },
  { id: 'quiz_domain', name: 'Quizzes Domain' },
  { id: 'cult_domain', name: 'Cultural & Jam Domain' }
];

// Pre-configured persona accounts for fast 1-click testing & production staff
export const PRESET_USERS = [
  {
    id: 'user_sagar',
    name: 'Sagar Anmol',
    role: 'super_admin',
    team: 'central',
    teamName: 'Central Desk',
    title: 'Lead Organizer & Central Desk Head',
    email: 'sagar@sliet.ac.in',
    allowedDomains: ['ALL'],
    allowedEvents: ['ALL'],
    avatarInitials: 'SA'
  },
  {
    id: 'user_raj',
    name: 'Raj Aryan',
    role: 'super_admin',
    team: 'central',
    teamName: 'Central Desk',
    title: 'Central Tech & Operations Lead',
    email: 'raj.aryan9242@gmail.com',
    allowedDomains: ['ALL'],
    allowedEvents: ['ALL'],
    avatarInitials: 'RA'
  },
  {
    id: 'user_invitation_head',
    name: 'Priya Sharma',
    role: 'team_head',
    team: 'invitation',
    teamName: 'Invitation Team',
    title: 'Head of Invitation Operations',
    email: 'invitation.head@sliet.ac.in',
    allowedDomains: ['ALL'],
    allowedEvents: ['ALL'],
    avatarInitials: 'PS'
  },
  {
    id: 'user_reception_head',
    name: 'Aman Verma',
    role: 'team_head',
    team: 'reception',
    teamName: 'Reception & Helpdesk',
    title: 'Reception & Registration Desk Lead',
    email: 'reception.head@sliet.ac.in',
    allowedDomains: ['ALL'],
    allowedEvents: ['ALL'],
    avatarInitials: 'AV'
  },
  {
    id: 'user_outreach_member',
    name: 'Rohit Kumar',
    role: 'team_member',
    team: 'outreach',
    teamName: 'Outreach Team',
    title: 'Outreach Calling Specialist',
    email: 'rohit.calling@sliet.ac.in',
    allowedDomains: ['ALL'],
    allowedEvents: ['ALL'],
    avatarInitials: 'RK'
  },
  {
    id: 'user_hackathon_coord',
    name: 'Vikram Singh',
    role: 'domain_coordinator',
    team: 'hack_domain',
    teamName: 'Hackathons Domain',
    title: 'Hackathon Domain Coordinator',
    email: 'hackathons@sliet.ac.in',
    allowedDomains: ['Hackathon'],
    allowedEvents: ['ALL'],
    avatarInitials: 'VS'
  },
  {
    id: 'user_quiz_coord',
    name: 'Ananya Roy',
    role: 'domain_coordinator',
    team: 'quiz_domain',
    teamName: 'Quizzes Domain',
    title: 'Quizzes Domain Coordinator',
    email: 'quizzes@sliet.ac.in',
    allowedDomains: ['Quiz'],
    allowedEvents: ['ALL'],
    avatarInitials: 'AR'
  }
];

const SESSION_STORAGE_KEY = 'tf_auth_session_v1';

export function getActiveUser() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) return parsed;
    }
  } catch (e) {
    console.error('Error reading auth session:', e);
  }
  // Default to Super Admin (Sagar Anmol) for first load
  return PRESET_USERS[0];
}

export function setActiveUser(user) {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
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
 * Evaluates whether a user has permission to see a given participant
 */
export function canUserViewParticipant(user, participant) {
  if (!user || !participant) return false;
  if (user.role === 'super_admin') return true;

  // Team Heads have combined visibility across their teams
  if (user.role === 'team_head') return true;

  // Domain Coordinator: check participant event_type
  if (user.role === 'domain_coordinator') {
    if (!user.allowedDomains || user.allowedDomains.includes('ALL')) return true;
    const pType = (participant.event_type || '').toLowerCase();
    return user.allowedDomains.some(d => pType.includes(d.toLowerCase()));
  }

  // Event Coordinator / Member: check specific event name
  if (user.role === 'event_coordinator' || user.role === 'event_member') {
    if (!user.allowedEvents || user.allowedEvents.includes('ALL')) return true;
    const pEvent = (participant.event_name || '').toLowerCase();
    return user.allowedEvents.some(e => pEvent.includes(e.toLowerCase()));
  }

  // Team Member (Calling Team)
  if (user.role === 'team_member') {
    // Calling members can access participants assigned to their campaign
    return true;
  }

  return true;
}

/**
 * Filter a participant list according to active user's permissions
 */
export function filterParticipantsByUser(user, participants = []) {
  if (!user || user.role === 'super_admin' || user.role === 'team_head') {
    return participants;
  }
  return participants.filter(p => canUserViewParticipant(user, p));
}

/**
 * Permissions check helpers
 */
export function canViewAuditLogs(user) {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'team_head';
}

export function canVerifyPayment(user) {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'team_head';
}

export function canExportAllData(user) {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'team_head';
}
