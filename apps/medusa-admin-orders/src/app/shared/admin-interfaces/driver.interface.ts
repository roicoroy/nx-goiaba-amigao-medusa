import { Order } from './order.interface';

/**
 * Driver interface representing a delivery driver in the system
 * Drivers are customers with special metadata indicating driver status
 */
export interface Driver {
  id: string;
  customer_id: string;
  customer: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: Record<string, any>;
  };
  metadata: {
    is_driver: boolean;
    driver_license?: string;
    vehicle_info?: string;
  };
  assigned_orders_count?: number;
  assigned_orders?: Order[];
  created_at: string;
  updated_at: string;
}

/**
 * Response interface for drivers list API endpoint
 */
export interface DriversResponse {
  drivers: Driver[];
  count: number;
  offset: number;
  limit: number;
}

/**
 * Filter parameters for querying drivers
 */
export interface DriverFilters {
  q?: string;
  limit?: number;
  offset?: number;
  fields?: string;
}
