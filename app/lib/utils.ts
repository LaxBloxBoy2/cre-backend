import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 * @param value Number to format
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a number with commas
 * @param value Number to format
 * @param decimals Number of decimal places (default: 0)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value Number to format (e.g., 0.05 for 5%)
 * @param decimals Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) {
    return '0.0%';
  }
  return `${value.toFixed(decimals)}%`;
}

/**
 * Truncate a string to a maximum length
 * @param text String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get initials from a name
 * @param name Full name
 * @returns Initials
 */
export function getInitials(name: string): string {
  if (!name) return '';

  return name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .toUpperCase();
}

/**
 * Generate a random color based on a string
 * @param str Input string
 * @returns Hex color code
 */
export function stringToColor(str: string): string {
  if (!str) return '#000000';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }

  return color;
}

/**
 * Calculate days remaining until a date
 * @param date Target date
 * @returns Number of days remaining (negative if in the past)
 */
export function daysRemaining(date: Date | string): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();

  // Reset time to midnight for accurate day calculation
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function getRelativeTimeString(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

  return targetDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
