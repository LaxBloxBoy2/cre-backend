/**
 * Format a number as currency
 * @param value Number to format
 * @param options Intl.NumberFormatOptions
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    ...options,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value Number to format
 * @param options Intl.NumberFormatOptions
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    ...options,
  }).format(value / 100);
}

/**
 * Format a number with commas
 * @param value Number to format
 * @param options Intl.NumberFormatOptions
 * @returns Formatted number string
 */
export function formatNumber(value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat('en-US', options).format(value);
}
