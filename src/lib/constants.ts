export const DOMAIN_CONFIG = {
  work: { color: 'emerald', bgColor: 'bg-emerald-100', icon: 'briefcase', label: 'Work' },
  health: { color: 'blue', bgColor: 'bg-blue-100', icon: 'activity', label: 'Health' },
  chores: { color: 'amber', bgColor: 'bg-amber-100', icon: 'home', label: 'Chores' },
  personal: { color: 'purple', bgColor: 'bg-purple-100', icon: 'user', label: 'Personal' },
  learning: { color: 'cyan', bgColor: 'bg-cyan-100', icon: 'book', label: 'Learning' }
};

export const PRIORITY_CONFIG = {
  'urgent-important': { color: 'red', label: 'Urgent & Important', sortOrder: 1 },
  'important': { color: 'orange', label: 'Important', sortOrder: 2 },
  'urgent': { color: 'yellow', label: 'Urgent', sortOrder: 3 },
  'low': { color: 'gray', label: 'Low', sortOrder: 4 }
};

export const STATUS_CONFIG = {
  'backlog': { label: 'Backlog', color: 'gray' },
  'planned': { label: 'Planned', color: 'blue' },
  'in_progress': { label: 'In Progress', color: 'yellow' },
  'blocked': { label: 'Blocked', color: 'red' },
  'done': { label: 'Done', color: 'green' },
  'archived': { label: 'Archived', color: 'gray' }
};

export const STATUS_FLOW = {
  backlog: ['planned', 'in_progress', 'done', 'archived'],
  planned: ['in_progress', 'backlog', 'done'],
  in_progress: ['done', 'blocked', 'planned'],
  blocked: ['in_progress', 'backlog', 'done'],
  done: ['archived', 'in_progress'],
  archived: ['backlog']
};

export const DEFAULT_BREAK_MINUTES = 15;
export const SCHEDULE_SLOT_MINUTES = 15;
