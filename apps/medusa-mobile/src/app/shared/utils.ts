import { nanoid } from 'nanoid';

/**
 * Convert any value to a number
 * @param x - Value to convert
 * @returns Converted number or NaN if conversion fails
 */
export function numberize(x: any): number {
  const num = Number(x);
  return isNaN(num) ? 0 : num;
}

/**
 * Generate a unique ID using nanoid
 * @returns Random string ID
 */
export function generateId(): string {
  return nanoid();
}

/**
 * Generate a unique ID with custom length
 * @param length - Length of the generated ID
 * @returns Random string ID with specified length
 */
export function generateIdWithLength(length: number): string {
  return nanoid(length);
}

/**
 * Format currency value with proper decimal places
 * @param amount - Amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Assuming amounts are in cents
}

/**
 * Debounce function to limit function calls
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

/**
 * Deep clone an object
 * @param obj - Object to clone
 * @returns Deep cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj = {} as any;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}
