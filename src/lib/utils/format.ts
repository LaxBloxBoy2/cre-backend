/**
 * Format a number as currency
 * @param value Number to format
 * @param options Formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
  value: number,
  options: { maximumFractionDigits?: number; currency?: string } = {}
): string => {
  const { maximumFractionDigits = 0, currency = 'USD' } = options;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits,
  }).format(value);
};

/**
 * Format a number as percentage
 * @param value Number to format (e.g., 12.5 for 12.5%)
 * @param options Formatting options
 * @returns Formatted percentage string
 */
export const formatPercentage = (
  value: number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string => {
  const { minimumFractionDigits = 1, maximumFractionDigits = 2 } = options;
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value / 100);
};

/**
 * Format a number with commas
 * @param value Number to format
 * @param options Formatting options
 * @returns Formatted number string
 */
export const formatNumber = (
  value: number,
  options: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
): string => {
  const { minimumFractionDigits = 0, maximumFractionDigits = 0 } = options;
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(value);
};
