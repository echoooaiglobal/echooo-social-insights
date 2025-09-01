// src/config/index.ts
// Centralized configuration management

export interface AppConfig {
  dashboardUrl: string
  apiBaseUrl: string
  environment: 'development' | 'production'
  version: string
}

export interface ApiEndpoints {
  campaigns: string
  users: string
  auth: string
}

/**
 * Get application configuration from environment variables
 */
export function getConfig(): AppConfig {
  return {
    dashboardUrl: process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000',
    apiBaseUrl: process.env.PLASMO_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v0',
    environment: (process.env.PLASMO_PUBLIC_ENV as 'development' | 'production') || 'development',
    version: '1.0.0'
  }
}

/**
 * Get API endpoints configuration
 */
export function getApiEndpoints(): ApiEndpoints {
  const config = getConfig()
  
  return {
    campaigns: `${config.apiBaseUrl}/campaigns`,
    users: `${config.apiBaseUrl}/users`,
    auth: `${config.apiBaseUrl}/auth`
  }
}

/**
 * Storage configuration
 */
export const STORAGE_CONFIG = {
  KEYS: {
    USER_DATA: 'userData',
    CAMPAIGNS: 'campaigns',
    DASHBOARD_AUTH: 'dashboardAuth',
    SELECTED_CAMPAIGN: 'selectedCampaign',
    LAST_SYNC: 'lastSync',
  },
  CACHE_DURATION: {
    USER_DATA: 5 * 60 * 1000,      // 5 minutes
    CAMPAIGNS: 10 * 60 * 1000,     // 10 minutes
    AUTH_CHECK: 2 * 60 * 1000      // 2 minutes
  }
} as const

/**
 * UI configuration
 */
export const UI_CONFIG = {
  POPUP_DIMENSIONS: {
    WIDTH: 350,
    HEIGHT: 500
  },
  ANIMATION_DURATION: 150,
  COLORS: {
    PRIMARY: '#3b82f6',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    GRAY: '#6b7280'
  }
} as const