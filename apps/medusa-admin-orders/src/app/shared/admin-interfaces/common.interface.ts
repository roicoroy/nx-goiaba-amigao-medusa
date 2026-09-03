// Common interfaces used across the application

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  success: boolean;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  offset: number;
  limit: number;
}

export interface ListResponse<T> extends PaginatedResponse<T> {
  // Alias for PaginatedResponse for backward compatibility
}

export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  order?: string;
}

export interface SearchOptions {
  q?: string;
  fields?: string[];
}

export interface QueryOptions extends PaginationOptions, SearchOptions {
  filters?: FilterOptions;
  expand?: string[];
  fields?: string[];
}

// Error interfaces
export interface ApiError {
  code: string;
  message: string;
  field?: string;
  type?: 'validation' | 'authentication' | 'authorization' | 'not_found' | 'server_error';
}

export interface ValidationError extends ApiError {
  type: 'validation';
  field: string;
}

// Status interfaces
export interface StatusOption {
  value: string;
  label: string;
  color?: string;
}

// UI State interfaces
export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'currency' | 'badge' | 'actions';
}

export interface ActionButton {
  label: string;
  icon?: string;
  color?: string;
  handler: (item: any) => void;
  visible?: (item: any) => boolean;
  disabled?: (item: any) => boolean;
}

// Form interfaces
export interface FormField {
  key: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { value: any; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | null;
  };
}

export interface FormConfig {
  fields: FormField[];
  submitLabel?: string;
  cancelLabel?: string;
}

// Notification interfaces
export interface NotificationOptions {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom' | 'middle';
  showCloseButton?: boolean;
}

// Modal interfaces
export interface ModalOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'confirm' | 'alert' | 'prompt';
  inputs?: {
    name: string;
    type: string;
    placeholder?: string;
    value?: any;
  }[];
}

// Currency and formatting
export interface CurrencyOptions {
  code: string;
  symbol: string;
  decimal_digits: number;
  rounding: number;
}

export interface FormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}
