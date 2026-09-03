/**
 * Application-wide constants
 */

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  USER_REGION: 'user_selected_region',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE_PREFERENCE: 'language_preference',
  CART_ID: 'cart_id',
  WISHLIST: 'wishlist_items',
  RECENT_SEARCHES: 'recent_searches',
} as const;

// UI Constants
export const UI_CONFIG = {
  DEBOUNCE_TIME: 300,
  ANIMATION_DURATION: 250,
  TOAST_DURATION: 3000,
  LOADING_DELAY: 500,
  PAGINATION_SIZE: 20,
} as const;

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 254,
  NAME_MAX_LENGTH: 50,
  PHONE_MIN_LENGTH: 10,
  PHONE_MAX_LENGTH: 15,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT_ERROR: 'Request timeout. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  REGISTRATION_SUCCESS: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  ADDRESS_ADDED: 'Address added successfully!',
  ADDRESS_UPDATED: 'Address updated successfully!',
  ADDRESS_DELETED: 'Address deleted successfully!',
  ITEM_ADDED_TO_CART: 'Item added to cart!',
  ITEM_REMOVED_FROM_CART: 'Item removed from cart!',
  ORDER_PLACED: 'Order placed successfully!',
} as const;

// Currency Configuration
export const CURRENCY_CONFIG = {
  DEFAULT_CURRENCY: 'USD',
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'] as const,
  DECIMAL_PLACES: 2,
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  SHORT_DATE: 'MM/dd/yyyy',
  LONG_DATE: 'MMMM dd, yyyy',
  DATE_TIME: 'MM/dd/yyyy HH:mm',
  TIME_ONLY: 'HH:mm',
  ISO_DATE: 'yyyy-MM-dd',
} as const;

// File Upload Configuration
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain'] as const,
} as const;

// Regular Expressions
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  POSTAL_CODE: /^[A-Za-z0-9\s\-]{3,10}$/,
  CREDIT_CARD: /^\d{13,19}$/,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_WISHLIST: true,
  ENABLE_REVIEWS: true,
  ENABLE_SOCIAL_LOGIN: true,
  ENABLE_GUEST_CHECKOUT: true,
  ENABLE_MULTI_CURRENCY: true,
  ENABLE_DARK_MODE: true,
} as const;

// App Metadata
export const APP_INFO = {
  NAME: 'Medusa Store',
  VERSION: '1.0.0',
  DESCRIPTION: 'Modern e-commerce application built with Angular and Ionic',
  AUTHOR: 'Your Company',
  SUPPORT_EMAIL: 'support@yourcompany.com',
} as const;
