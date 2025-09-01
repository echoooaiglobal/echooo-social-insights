// src/lib/storage.ts - Updated to include campaigns
import { Storage } from "@plasmohq/storage"
import type { Campaign } from './campaignsApi'

const storage = new Storage()

// Storage keys
export const STORAGE_KEYS = {
  USER_DATA: 'userData',
  CAMPAIGNS: 'campaigns',
  DASHBOARD_AUTH: 'dashboardAuth',
  SELECTED_CAMPAIGN: 'selectedCampaign',
  LAST_SYNC: 'lastSync',
  IS_AUTHENTICATED: 'isAuthenticated',
} as const

// User data interface
export interface UserData {
  id: string
  fullName: string
  email: string
  companyName: string
  isAuthenticated: boolean
  lastUpdated: number
}

// Dashboard auth data interface
export interface DashboardAuthData {
  accessToken: string
  refreshToken: string
  tokenExpiry: string
  user: string // JSON string
  company: string // JSON string  
  roles: string // JSON string
}

/**
 * Save user data to storage
 */
export async function saveUserData(userData: UserData): Promise<void> {
  try {
    await storage.set(STORAGE_KEYS.USER_DATA, userData)
    console.log('✅ User data saved to storage')
  } catch (error) {
    console.error('❌ Failed to save user data:', error)
    throw error
  }
}

/**
 * Get user data from storage
 */
export async function getUserData(): Promise<UserData | null> {
  try {
    const userData = await storage.get(STORAGE_KEYS.USER_DATA)
    return userData ? JSON.parse(userData as string) : null
  } catch (error) {
    console.error('❌ Failed to get user data:', error)
    return null
  }
}

/**
 * Save campaigns to storage
 */
export async function saveCampaigns(campaigns: Campaign[]): Promise<void> {
  try {
    await storage.set(STORAGE_KEYS.CAMPAIGNS, campaigns)
    await storage.set(STORAGE_KEYS.LAST_SYNC, Date.now())
    console.log(`✅ Saved ${campaigns.length} campaigns to storage`)
  } catch (error) {
    console.error('❌ Failed to save campaigns:', error)
    throw error
  }
}

/**
 * Get campaigns from storage
 */
export async function getCampaigns(): Promise<Campaign[]> {
  try {
    const campaigns = await storage.get(STORAGE_KEYS.CAMPAIGNS)
    return campaigns || []
  } catch (error) {
    console.error('❌ Failed to get campaigns:', error)
    return []
  }
}

/**
 * Save selected campaign ID
 */
export async function saveSelectedCampaign(campaignId: string): Promise<void> {
  try {
    await storage.set(STORAGE_KEYS.SELECTED_CAMPAIGN, campaignId)
    console.log('✅ Selected campaign saved:', campaignId)
  } catch (error) {
    console.error('❌ Failed to save selected campaign:', error)
    throw error
  }
}

/**
 * Get selected campaign ID
 */
export async function getSelectedCampaign(): Promise<string | null> {
  try {
    const campaignId = await storage.get(STORAGE_KEYS.SELECTED_CAMPAIGN)
    return campaignId || null
  } catch (error) {
    console.error('❌ Failed to get selected campaign:', error)
    return null
  }
}

/**
 * Save dashboard auth data
 */
export async function saveDashboardAuth(authData: DashboardAuthData): Promise<void> {
  try {
    await storage.set(STORAGE_KEYS.DASHBOARD_AUTH, authData)
    console.log('✅ Dashboard auth data saved')
  } catch (error) {
    console.error('❌ Failed to save dashboard auth:', error)
    throw error
  }
}

/**
 * Get dashboard auth data
 */
export async function getDashboardAuth(): Promise<DashboardAuthData | null> {
  try {
    const authData = await storage.get(STORAGE_KEYS.DASHBOARD_AUTH)
    return authData || null
  } catch (error) {
    console.error('❌ Failed to get dashboard auth:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const userData = await getUserData()
    const authData = await getDashboardAuth()
    
    if (!userData || !authData) {
      return false
    }

    // Check if token is still valid
    const isTokenValid = authData.tokenExpiry && Date.now() < parseInt(authData.tokenExpiry)
    
    return userData.isAuthenticated && isTokenValid
  } catch (error) {
    console.error('❌ Failed to check authentication status:', error)
    return false
  }
}

/**
 * Clear all stored data (logout)
 */
export async function clearStorage(): Promise<void> {
  try {
    await storage.clear()
    console.log('✅ Storage cleared')
  } catch (error) {
    console.error('❌ Failed to clear storage:', error)
    throw error
  }
}

/**
 * Get last sync timestamp
 */
export async function getLastSync(): Promise<number> {
  try {
    const lastSync = await storage.get(STORAGE_KEYS.LAST_SYNC)
    return lastSync ? parseInt(lastSync, 10) : 0
  } catch (error) {
    console.error('❌ Failed to get last sync:', error)
    return 0
  }
}

/**
 * Check if campaigns data is stale (older than 5 minutes)
 */
export async function isCampaignsDataStale(): Promise<boolean> {
  try {
    const lastSync = await getLastSync()
    const FIVE_MINUTES = 5 * 60 * 1000
    return Date.now() - lastSync > FIVE_MINUTES
  } catch (error) {
    console.error('❌ Failed to check if campaigns data is stale:', error)
    return true // Assume stale on error
  }
}

/**
 * Debug function to see all stored data
 */
export async function debugStorage(): Promise<void> {
  try {
    const all = await storage.getAll()
    console.log('🔍 ALL STORAGE DATA:', all)
  } catch (error) {
    console.error('❌ Debug storage failed:', error)
  }
}