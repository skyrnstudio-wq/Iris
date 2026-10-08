export type Domain = 'work' | 'health' | 'chores' | 'personal' | 'learning';

export const DOMAIN_COLORS: Record<Domain, string> = {
  work: 'bg-emerald-600',
  health: 'bg-sky-600',
  chores: 'bg-amber-600',
  personal: 'bg-purple-600',
  learning: 'bg-teal-600',
};

export const DOMAIN_BADGE_STYLES: Record<Domain, { bg: string; text: string; border: string }> = {
  work: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200/80',
  },
  health: {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200/80',
  },
  chores: {
    bg: 'bg-amber-50',
    text: 'text-amber-900',
    border: 'border-amber-200/80',
  },
  personal: {
    bg: 'bg-purple-50',
    text: 'text-purple-900',
    border: 'border-purple-200/80',
  },
  learning: {
    bg: 'bg-teal-50',
    text: 'text-teal-900',
    border: 'border-teal-200/80',
  },
};

export const DOMAIN_TEXT_COLORS: Record<Domain, string> = {
  work: 'text-emerald-700',
  health: 'text-sky-700',
  chores: 'text-amber-800',
  personal: 'text-purple-700',
  learning: 'text-teal-700',
};
