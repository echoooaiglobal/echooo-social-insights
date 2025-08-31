// src/lib/storage.ts
// Chrome storage utilities for extension data

import { Storage } from "@plasmohq/storage"

// Initialize Plasmo storage
const storage = new Storage()

export interface UserData {
  id: string
  fullName: string
  email: string
  companyName: string
  isAuthenticated: boolean
  lastUpdated: number
}

export interface Campaign {
  id: string
  name: string
  status: string
  createdAt: string
}

export interface ExtensionData {
  user: UserData | null
  campaigns: Campaign[]
  authToken: string | null
  lastSync: number
}

/**
 * Storage keys used by the extension
 */
export const STORAGE_KEYS = {
  USER_DATA: 'user',
  CAMPAIGNS: 'campaigns',
  AUTH_TOKEN: 'accessToken',
  LAST_SYNC: 'lastSync',
  IS_AUTHENTICATED: 'isAuthenticated'
} as const

/**
 * Save user data to storage
 */
export async function saveUserData(userData: UserData): Promise<void> {
  try {
    await storage.set(STORAGE_KEYS.USER_DATA, userData)
    await storage.set(STORAGE_KEYS.IS_AUTHENTICATED, userData.isAuthenticated)
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
    return userData ? JSON.parse(userData) : null
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
    console.log('✅ Campaigns saved to storage')
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
    return campaigns ? JSON.parse(campaigns) : []
  } catch (error) {
    console.error('❌ Failed to get campaigns:', error)
    return []
  }
}

/**
 * Save auth token to storage
 */
export async function saveAuthToken(token: string): Promise<void> {
  try {
    await storage.set(STORAGE_KEYS.AUTH_TOKEN, token)
    console.log('✅ Auth token saved to storage')
  } catch (error) {
    console.error('❌ Failed to save auth token:', error)
    throw error
  }
}

/**
 * Get auth token from storage
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const token = await storage.get(STORAGE_KEYS.AUTH_TOKEN)
    return token || null
  } catch (error) {
    console.error('❌ Failed to get auth token:', error)
    return null
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const isAuth = await storage.get(STORAGE_KEYS.IS_AUTHENTICATED)
    return Boolean(isAuth)
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