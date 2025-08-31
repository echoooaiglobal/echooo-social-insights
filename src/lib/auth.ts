// src/lib/auth.ts
// Fixed authentication utilities - simple and reliable
import { Storage } from "@plasmohq/storage"
import type { UserData } from './storage'

const storage = new Storage()

/**
 * Check if user is authenticated by checking cached dashboard auth
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    // Check storage directly - no proactive checking to avoid infinite loops
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

    // Create formatted user data
    const formattedUserData: UserData = {
      id: userData.id,
      fullName: userData.full_name || 
                (userData.first_name && userData.last_name ? 
                 `${userData.first_name} ${userData.last_name}` : 
                 userData.email || 'User'),
      email: userData.email,
      companyName: companyData?.name || companyData?.domain || 'Company',
      isAuthenticated: true,
      lastUpdated: Date.now()
    }

    // Cache in extension storage
    await storage.set('userData', formattedUserData)
    
    console.log('✅ User data synced:', formattedUserData)
    return formattedUserData

  } catch (error) {
    console.error('❌ Failed to sync user data:', error)
    return null
  }
}

/**
 * Get cached user data
 */
export async function getCachedUserData(forceRefresh = false): Promise<UserData | null> {
  try {
    if (forceRefresh) {
      return await syncUserData()
    }

    // Try to get from cache first
    const cachedData = await storage.get('userData')
    
    if (cachedData && cachedData.isAuthenticated) {
      console.log('📄 Using cached user data')
      return cachedData
    }

    // If no cache, try to sync
    console.log('🔄 No cached data, attempting sync...')
    return await syncUserData()
    
  } catch (error) {
    console.error('❌ Failed to get cached user data:', error)
    return null
  }
}

/**
 * Manual refresh - triggers background script to check dashboard
 */
export async function refreshAuthFromDashboard(): Promise<boolean> {
  try {
    console.log('🔄 Manually triggering dashboard auth check...')
    
    // Send message to background to check auth
    const response = await chrome.runtime.sendMessage({
      type: 'TRIGGER_AUTH_CHECK'
    })
    
    console.log('📨 Refresh response:', response)
    
    // Wait briefly for background processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if we now have auth data
    const authStatus = await checkAuthentication()
    return authStatus
    
  } catch (error) {
    console.error('❌ Failed to refresh auth from dashboard:', error)
    return false
  }
}

/**
 * Open login page
 */
export async function openLoginPage(): Promise<void> {
  try {
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    const loginUrl = `${dashboardUrl}/login`
    
    await chrome.tabs.create({ url: loginUrl })
    console.log('🔗 Login page opened')
  } catch (error) {
    console.error('❌ Failed to open login page:', error)
    throw error
  }
}

/**
 * Logout - clear all cached data
 */
export async function logout(): Promise<void> {
  try {
    await storage.remove('dashboardAuth')
    await storage.remove('userData')
    console.log('🚪 Logged out successfully')
  } catch (error) {
    console.error('❌ Failed to logout:', error)
    throw error
  }
}

/**
 * Check if dashboard is accessible (user is on dashboard domain)
 */
export async function isDashboardAccessible(): Promise<boolean> {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const currentTab = tabs[0]
    
    if (!currentTab?.url) return false
    
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    return currentTab.url.startsWith(dashboardUrl)
  } catch (error) {
    console.error('❌ Failed to check dashboard accessibility:', error)
    return false
  }
}

/**
 * Debug function to see all extension storage
 */
export async function debugStorage(): Promise<void> {
  try {
    const all = await storage.getAll()
    console.log('🔍 ALL EXTENSION STORAGE:', all)
  } catch (error) {
    console.error('❌ Debug storage failed:', error)
  }
}