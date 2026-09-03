// User and authentication interfaces
export interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  api_token?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

export interface AuthResponse {
  user: AdminUser;
  token: string;
}

// JWT Authentication response from Medusa auth endpoints
export interface JwtAuthResponse {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface CustomerGroup {
  id: string;
  name: string;
  customers?: any[]; // Use any to avoid circular dependency
  price_lists?: PriceList[];
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  metadata?: Record<string, any>;
}

// Import Order interface to avoid circular dependency
interface PriceList {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  starts_at?: string;
  ends_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
