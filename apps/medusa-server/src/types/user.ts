export interface ExtendedUser {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  role?: string
  metadata?: Record<string, any> | null
  created_at: Date | string
  updated_at: Date | string
  deleted_at?: Date | string | null
}
