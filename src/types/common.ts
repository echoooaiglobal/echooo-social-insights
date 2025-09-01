// src/types/common.ts
// Common types used across the extension

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

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

export interface ExtensionStorage {
  userData?: any
  campaigns?: any[]
  dashboardAuth?: any
  selectedCampaign?: string
  lastSync?: number
}