// API URL
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cre-backend-0pvq.onrender.com';

// Deal statuses
export const DEAL_STATUSES = {
  DRAFT: 'draft',
  IN_REVIEW: 'in_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ARCHIVED: 'archived',
};

// Deal property types
export const PROPERTY_TYPES = [
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'multifamily', label: 'Multifamily' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'land', label: 'Land' },
  { value: 'other', label: 'Other' },
];

// Task priorities
export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// Alert severities
export const ALERT_SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
};

// Default deal stages
export const DEFAULT_DEAL_STAGES = [
  { name: 'Initial', order: 1, target_days: 7 },
  { name: 'Due Diligence', order: 2, target_days: 14 },
  { name: 'Negotiation', order: 3, target_days: 10 },
  { name: 'Final Approval', order: 4, target_days: 7 },
  { name: 'Closing', order: 5, target_days: 10 },
];

// Dashboard chart periods
export const CHART_PERIODS = [
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
];

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
};

// Local storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  SETTINGS: 'settings',
};

// Theme options
export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
};

// Default settings
export const DEFAULT_SETTINGS = {
  theme: THEMES.DARK,
  explainerMode: true,
  notifications: true,
  compactView: false,
};
