// src/utils/constants.ts
// Application constants and configuration

export const APP_CONFIG = {
  name: 'Echooo Dashboard Extension',
  version: '1.0.0',
  description: 'Access your Echooo dashboard data anywhere on the web',
  author: 'Echooo Team'
} as const

export const API_ENDPOINTS = {
  AUTH_CHECK: '/auth/check',
  CURRENT_USER: '/users/current',
  USER_CAMPAIGNS: '/campaigns',
  USER_PROFILE: '/profile',
  LOGOUT: '/auth/logout'
} as const

export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  CAMPAIGNS: 'campaigns',
  AUTH_TOKEN: 'authToken',
  LAST_SYNC: 'lastSync',
  IS_AUTHENTICATED: 'isAuthenticated',
  SELECTED_CAMPAIGN: 'selectedCampaign'
} as const

export const CACHE_DURATION = {
  USER_DATA: 5 * 60 * 1000,      // 5 minutes
  CAMPAIGNS: 10 * 60 * 1000,     // 10 minutes
  AUTH_CHECK: 2 * 60 * 1000      // 2 minutes
} as const

export const SYNC_INTERVALS = {
  BACKGROUND_SYNC: 10 * 60 * 1000,  // 10 minutes
  POPUP_REFRESH: 30 * 1000,         // 30 seconds
  AUTH_CHECK: 60 * 1000             // 1 minute
} as const

export const UI_CONFIG = {
  POPUP_WIDTH: 320,
  POPUP_HEIGHT: 400,
  ANIMATION_DURATION: 150,
  DEBOUNCE_DELAY: 300
} as const

export const MESSAGE_TYPES = {
  CHECK_AUTH: 'CHECK_AUTH',
  SYNC_DATA: 'SYNC_DATA',
  OPEN_LOGIN: 'OPEN_LOGIN',
  LOGOUT: 'LOGOUT',
  REFRESH_DATA: 'REFRESH_DATA',
  GET_CAMPAIGNS: 'GET_CAMPAIGNS'
} as const

export const CAMPAIGN_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  DRAFT: 'draft',
  COMPLETED: 'completed'
} as const

export const ERROR_MESSAGES = {
  AUTH_FAILED: 'Authentication failed. Please log in again.',
  API_ERROR: 'Unable to connect to dashboard. Please try again.',
  NETWORK_ERROR: 'Network connection error. Check your internet connection.',
  STORAGE_ERROR: 'Failed to save data locally.',
  NO_CAMPAIGNS: 'No campaigns found. Create one in your dashboard.',
  SYNC_FAILED: 'Failed to sync data from dashboard.'
} as const

export const SUCCESS_MESSAGES = {
  AUTH_SUCCESS: 'Successfully authenticated!',
  DATA_SYNCED: 'Data synced successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REFRESH_SUCCESS: 'Data refreshed'
} as const

// URLs and paths
export const URLS = {
  DASHBOARD_LOGIN: '/login',
  DASHBOARD_HOME: '/dashboard',
  API_BASE: '/api/v0'
} as const

// Extension permissions required
export const REQUIRED_PERMISSIONS = [
  'storage',
  'cookies',
  'activeTab'
] as const

// Host permissions for your dashboard
export const HOST_PERMISSIONS = [
  'https://yourdashboard.com/*',
  'https://api.yourdashboard.com/*',
  'http://localhost:3000/*',    // Development dashboard
  'http://localhost:8000/*'     // Development API
] as const