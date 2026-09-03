/**
 * Store Staff interfaces for managing store staff members
 * Store staff are customers with elevated privileges (is_store_staff: true)
 */

export interface StoreStaff {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  company_name?: string;
  has_account: boolean;
  is_store_staff: boolean;
  staff_role: string; // "staff", "manager", "supervisor"
  staff_since: string; // ISO 8601 date
  metadata: {
    is_store_staff: boolean;
    privilege: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateStaffData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  staff_role?: string; // defaults to "staff"
}

export interface UpdateStaffData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  staff_role?: string;
}

export interface StoreStaffListResponse {
  customers: StoreStaff[];
}

export interface StoreStaffResponse {
  customer: StoreStaff;
}

export interface StoreStaffDeleteResponse {
  success: boolean;
  message: string;
  id?: string;
}
