// src/lib/auth.ts - Debug version with better error handling
import { Storage } from "@plasmohq/storage"
import type { UserData } from './storage'

const storage = new Storage()

/**
 * Debug version - check auth with detailed logging
 */
export async function refreshAuthFromDashboard(): Promise<boolean> {
  try {
    console.log('🔄 [DEBUG] Starting manual auth check...')
    
    // First, check if we can find dashboard tabs
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    const tabs = await chrome.tabs.query({ url: `${dashboardUrl}/*` })
    
    console.log(`🔍 [DEBUG] Found ${tabs.length} dashboard tabs`)
    
    if (tabs.length === 0) {
      console.log('❌ [DEBUG] No dashboard tabs found - user needs to open dashboard')
      return false
    }
    
    // Try to directly inject script and get immediate result
    const tab = tabs[0]
    if (!tab.id) {
      console.log('❌ [DEBUG] Tab has no ID')
      return false
    }
    
    console.log(`🎯 [DEBUG] Injecting script into tab ${tab.id}`)
    
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Direct localStorage check with immediate return
          const accessToken = localStorage.getItem('accessToken')
          const refreshToken = localStorage.getItem('refreshToken') 
          const tokenExpiry = localStorage.getItem('tokenExpiry')
          const user = localStorage.getItem('user')
          const company = localStorage.getItem('company')
          const roles = localStorage.getItem('roles')
          
          console.log('📊 [INJECTED] Dashboard localStorage check:', {
            hasAccessToken: !!accessToken,
            hasUser: !!user,
            hasCompany: !!company
          })
          
          // Return the data directly instead of messaging
          if (accessToken && user) {
            return {
              success: true,
              authData: {
                accessToken,
                refreshToken,
                tokenExpiry,
                user,
                company,
                roles
              }
            }
          } else {
            return { success: false, error: 'No auth data found' }
          }
        }
      })
      
      console.log('📨 [DEBUG] Script injection results:', results)
      
      if (results && results[0] && results[0].result) {
        const result = results[0].result
        
        if (result.success && result.authData) {
          console.log('✅ [DEBUG] Auth data found, caching...')
          
          // Cache the auth data directly
          await storage.set('dashboardAuth', result.authData)
          
          // Create user data
          try {
            const userData = JSON.parse(result.authData.user)
            const companyData = result.authData.company ? JSON.parse(result.authData.company) : null
            
            const formattedUserData = {
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
            
            await storage.set('userData', formattedUserData)
            console.log('✅ [DEBUG] User data cached successfully')
            return true
          } catch (parseError) {
            console.error('❌ [DEBUG] Error parsing user data:', parseError)
            return false
          }
        } else {
          console.log('❌ [DEBUG] No auth data found in dashboard')
          return false
        }
      } else {
        console.log('❌ [DEBUG] No results from script injection')
        return false
      }
      
    } catch (injectionError) {
      console.error('❌ [DEBUG] Script injection failed:', injectionError)
      return false
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Auth check failed:', error)
    return false
  }
}

// Keep all other functions the same...
export async function checkAuthentication(): Promise<boolean> {
  try {
    const dashboardAuth = await storage.get('dashboardAuth')
    
    if (!dashboardAuth || !dashboardAuth.accessToken) {
      console.log('❌ No cached dashboard auth found')
      return false
    }

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

export async function syncUserData(): Promise<UserData | null> {
  try {
    const dashboardAuth = await storage.get('dashboardAuth')
    
    if (!dashboardAuth || !dashboardAuth.user) {
      console.error('❌ No dashboard auth data available for sync')
      return null
    }

    const userData = JSON.parse(dashboardAuth.user)
    const companyData = dashboardAuth.company ? JSON.parse(dashboardAuth.company) : null

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

    await storage.set('userData', formattedUserData)
    
    console.log('✅ User data synced:', formattedUserData)
    return formattedUserData

  } catch (error) {
    console.error('❌ Failed to sync user data:', error)
    return null
  }
}

export async function getCachedUserData(forceRefresh = false): Promise<UserData | null> {
  try {
    if (forceRefresh) {
      return await syncUserData()
    }

    const cachedData = await storage.get('userData')
    
    if (cachedData && cachedData.isAuthenticated) {
      console.log('📄 Using cached user data')
      return cachedData
    }

    console.log('🔄 No cached data, attempting sync...')
    return await syncUserData()
    
  } catch (error) {
    console.error('❌ Failed to get cached user data:', error)
    return null
  }
}

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

export async function debugStorage(): Promise<void> {
  try {
    const all = await storage.getAll()
    console.log('🔍 ALL EXTENSION STORAGE:', all)
  } catch (error) {
    console.error('❌ Debug storage failed:', error)
  }
}