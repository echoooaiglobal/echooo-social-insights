// src/types/auth.ts
// Authentication related types

export interface User {
  id: string
  full_name: string
  first_name?: string
  last_name?: string
  email: string
  phone_number?: string
  status: string
  user_type: string
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  domain?: string
  created_at: string
  updated_at: string
}

export interface UserData {
  id: string
  fullName: string
  email: string
  companyName: string
  companyId: string
  isAuthenticated: boolean
  lastUpdated: number
}

export interface DashboardAuthData {
  accessToken: string
  refreshToken: string
  tokenExpiry: string
  user: string // JSON string
  company: string // JSON string  
  roles: string // JSON string
}

export interface AuthState {
  isAuthenticated: boolean
  userData: UserData | null
  loading: boolean
  error: string | null
}