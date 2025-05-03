import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a currency value with Indian Rupee symbol
 * @param value Value to format
 * @param locale Locale to use for formatting (default: en-IN)
 * @returns Formatted currency string
 */
export function formatCurrency(value: string | number, locale: string = 'en-IN'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '₹0.00';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

/**
 * Generates a unique ID
 * @returns Unique string ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Format a date to a human-readable format
 * @param date Date to format
 * @param format Format to use (short, medium, long)
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | undefined | null,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-IN');
    case 'long':
      return dateObj.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'medium':
    default:
      return dateObj.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
  }
}

/**
 * Format a relative time (e.g., "2 hours ago")
 * @param date Date to calculate relative time from
 * @returns Formatted relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return formatDate(dateObj, 'short');
}

/**
 * Validates a mobile number format (Indian)
 * @param number Mobile number to validate
 * @returns Boolean indicating if the number is valid
 */
export function validateMobileNumber(number: string): boolean {
  // Indian mobile number validation (10 digits, optionally with +91 prefix)
  const regex = /^(\+91[\-\s]?)?[0]?(91)?[6789]\d{9}$/;
  return regex.test(number);
}

/**
 * Truncates text to a specified length with ellipsis
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
