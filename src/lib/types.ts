// src/lib/types.ts
// Shared TypeScript types for the extension

export interface User {
  id: string
  full_name: string
  email: string
  company_name: string
  created_at?: string
  updated_at?: string
}

export interface Campaign {
  id: string
  name: string
  status: 'active' | 'paused' | 'draft' | 'completed'
  description?: string
  created_at: string
  updated_at?: string
  budget?: number
  target_audience?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface UserProfile {
  user: User
  campaigns: Campaign[]
  company: {
    id: string
    name: string
    plan: string
  }
}

// Extension-specific types
export interface ExtensionState {
  isAuthenticated: boolean
  userData: UserData | null
  campaigns: Campaign[]
  loading: boolean
  error: string | null
}

export interface UserData {
  id: string
  fullName: string
  email: string
  companyName: string
  isAuthenticated: boolean
  lastUpdated: number
}

export interface StorageData {
  userData?: UserData
  campaigns?: Campaign[]
  authToken?: string
  lastSync?: number
  isAuthenticated?: boolean
}

// Message types for communication between components
export interface BackgroundMessage {
  type: 'CHECK_AUTH' | 'SYNC_DATA' | 'OPEN_LOGIN' | 'LOGOUT'
  payload?: any
}

export interface MessageResponse {
  success: boolean
  data?: any
  error?: string
}

// Environment configuration
export interface EnvConfig {
  apiBaseUrl: string
  dashboardUrl: string
  environment: 'development' | 'production'
}

// Authentication status
export interface AuthStatus {
  authenticated: boolean
  user?: User
  expiresAt?: number
}

// Campaign selection state
export interface CampaignSelection {
  selectedCampaignId: string | null
  availableCampaigns: Campaign[]
}

// Error types
export type ExtensionError = 
  | 'AUTH_FAILED'
  | 'API_ERROR'
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'UNKNOWN_ERROR'

export interface ExtensionErrorDetails {
  type: ExtensionError
  message: string
  timestamp: number
  context?: any
}