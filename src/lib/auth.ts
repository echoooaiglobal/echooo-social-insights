// src/lib/auth.ts
// Authentication utilities for extension
// Updated to work with dashboard localStorage via content script

import { Storage } from "@plasmohq/storage"
import type { UserData } from './storage'

const storage = new Storage()

/**
 * Check if user is authenticated by checking cached dashboard auth
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    // Check if we have cached dashboard auth data
    const dashboardAuth = await storage.get('dashboardAuth')
    
    if (!dashboardAuth || !dashboardAuth.accessToken) {
      console.log('❌ No cached dashboard auth found')
      return false
    }

    // Check if token is still valid
    const isTokenValid = dashboardAuth.tokenExpiry && Date.now() < parseInt(dashboardAuth.tokenExpiry)
    
    if (!isTokenValid) {
      console.log('❌ Dashboard token expired')
      await storage.remove('dashboardAuth')
      await storage.remove('userData')
      return false
    }

    console.log('✅ Dashboard authentication valid')
    return true
  } catch (error) {
    console.error('❌ Authentication check failed:', error)
    return false
  }
}

/**
 * Sync user data from cached dashboard auth
 */
export async function syncUserData(): Promise<UserData | null> {
  try {
    const dashboardAuth = await storage.get('dashboardAuth')
    
    if (!dashboardAuth || !dashboardAuth.user) {
      console.error('❌ No dashboard auth data available for sync')
      return null
    }

    // Parse user data from dashboard localStorage
    const userData = JSON.parse(dashboardAuth.user)
    const companyData = dashboardAuth.company ? JSON.parse(dashboardAuth.company) : null

    const extensionUserData: UserData = {
      id: userData.id,
      fullName: userData.full_name || userData.first_name + ' ' + userData.last_name || 'User',
      email: userData.email,
      companyName: companyData?.name || 'Company',
      isAuthenticated: true,
      lastUpdated: Date.now()
    }

    // Save to extension storage
    await storage.set('userData', extensionUserData)
    
    // Also try to get campaigns (mock data for now, you can add real API call later)
    const mockCampaigns = [
      {
        id: '1',
        name: 'Sample Campaign',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    ]
    
    const { saveCampaigns } = await import('./storage')
    await saveCampaigns(mockCampaigns)

    console.log('✅ User data synced successfully:', extensionUserData)
    return extensionUserData
  } catch (error) {
    console.error('❌ Failed to sync user data:', error)
    return null
  }
}

/**
 * Open dashboard login page in new tab
 */
export async function openLoginPage(): Promise<void> {
  try {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'OPEN_LOGIN' }, (response) => {
        if (response?.success) {
          console.log('✅ Login page opened')
          resolve()
        } else {
          reject(new Error(response?.error || 'Failed to open login page'))
        }
      })
    })
  } catch (error) {
    console.error('❌ Failed to open login page:', error)
    throw error
  }
}

/**
 * Logout user and clear all data
 */
export async function logout(): Promise<void> {
  try {
    // Clear extension storage
    await storage.clear()
    
    console.log('✅ Extension logged out successfully')
  } catch (error) {
    console.error('❌ Failed to logout:', error)
    throw error
  }
}

/**
 * Get cached user data with optional refresh
 */
export async function getCachedUserData(forceRefresh = false): Promise<UserData | null> {
  try {
    if (forceRefresh) {
      return await syncUserData()
    }

    // Check if we have recent cached data (less than 5 minutes old)
    const cachedData = await storage.get('userData')
    if (cachedData) {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
      if (cachedData.lastUpdated > fiveMinutesAgo) {
        return cachedData
      }
    }

    // Data is stale or doesn't exist, try to sync from dashboard auth
    return await syncUserData()
  } catch (error) {
    console.error('❌ Failed to get user data:', error)
    return null
  }
}

/**
 * Request dashboard auth sync (triggers content script to send fresh data)
 */
export async function requestDashboardSync(): Promise<boolean> {
  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'SYNC_DATA' }, (response) => {
        resolve(response?.success || false)
      })
    })
  } catch (error) {
    console.error('❌ Failed to request dashboard sync:', error)
    return false
  }
}