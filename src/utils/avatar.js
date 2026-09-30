// Deterministic Soft Vibrant Avatar Colors (Linear / Stripe inspired)
export const AVATAR_PALETTES = [
  { bg: 'rgba(56, 189, 248, 0.15)', text: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' }, // Cyan
  { bg: 'rgba(52, 211, 153, 0.15)', text: '#34d399', border: 'rgba(52, 211, 153, 0.3)' }, // Emerald
  { bg: 'rgba(192, 132, 252, 0.15)', text: '#c084fc', border: 'rgba(192, 132, 252, 0.3)' }, // Purple
  { bg: 'rgba(251, 191, 36, 0.15)', text: '#fbbf24', border: 'rgba(251, 191, 36, 0.3)' }, // Amber
  { bg: 'rgba(251, 113, 133, 0.15)', text: '#fb7185', border: 'rgba(251, 113, 133, 0.3)' }, // Rose
  { bg: 'rgba(129, 140, 248, 0.15)', text: '#818cf8', border: 'rgba(129, 140, 248, 0.3)' }, // Indigo
  { bg: 'rgba(45, 212, 191, 0.15)', text: '#2dd4bf', border: 'rgba(45, 212, 191, 0.3)' }, // Teal
  { bg: 'rgba(251, 146, 60, 0.15)', text: '#fb923c', border: 'rgba(251, 146, 60, 0.3)' }  // Orange
];

export function getAvatarStyle(name) {
  let hash = 0;
  const str = String(name || 'Participant');
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const p = AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
  return {
    backgroundColor: p.bg,
    color: p.text,
    border: `1px solid ${p.border}`
  };
}

export function getInitials(name) {
  if (!name) return 'TF';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
