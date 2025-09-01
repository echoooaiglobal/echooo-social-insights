// src/services/auth.ts
// Fixed authentication service that works with existing auth flow

import { Storage } from "@plasmohq/storage"
import { getConfig } from '../config'

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

export class AuthService {
  private storage: Storage
  private config: ReturnType<typeof getConfig>

  constructor() {
    this.storage = new Storage()
    this.config = getConfig()
  }

  /**
   * Check if user is authenticated - compatible with existing flow
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const dashboardAuth = await this.storage.get('dashboardAuth')
      
      if (!dashboardAuth || !dashboardAuth.accessToken) {
        console.log('❌ [AuthService] No cached dashboard auth found')
        return false
      }

      // Check if token is still valid
      const isTokenValid = dashboardAuth.tokenExpiry && Date.now() < parseInt(dashboardAuth.tokenExpiry)
      
      if (!isTokenValid) {
        console.log('❌ [AuthService] Dashboard token expired')
        await this.storage.remove('dashboardAuth')
        await this.storage.remove('userData')
        return false
      }

      console.log('✅ [AuthService] Dashboard authentication valid')
      return true
    } catch (error) {
      console.error('❌ [AuthService] Authentication check failed:', error)
      return false
    }
  }

  /**
   * Get user data - compatible with existing flow
   */
  async getUserData(): Promise<UserData | null> {
    try {
      const userData = await this.storage.get('userData')
      return userData || null
    } catch (error) {
      console.error('❌ [AuthService] Failed to get user data:', error)
      return null
    }
  }

  /**
   * Get access token for API requests
   */
  async getAccessToken(): Promise<string | null> {
    try {
      const authData = await this.storage.get('dashboardAuth')
      
      if (!authData?.accessToken) {
        return null
      }

      // Check if token is still valid
      if (!this.isTokenValid(authData.tokenExpiry)) {
        console.log('❌ [AuthService] Token expired, clearing auth data')
        await this.clearAuthData()
        return null
      }

      return authData.accessToken
    } catch (error) {
      console.error('❌ [AuthService] Failed to get access token:', error)
      return null
    }
  }

  /**
   * Get company ID from stored data
   */
  async getCompanyId(): Promise<string | null> {
    try {
      const authData = await this.storage.get('dashboardAuth')
      if (!authData?.company) return null

      const company = JSON.parse(authData.company)
      return company?.id || null
    } catch (error) {
      console.error('❌ [AuthService] Failed to get company ID:', error)
      return null
    }
  }

  /**
   * Check if token is still valid
   */
  private isTokenValid(tokenExpiry: string): boolean {
    if (!tokenExpiry) return false
    
    try {
      const expiryTime = parseInt(tokenExpiry, 10)
      return Date.now() < expiryTime
    } catch (error) {
      console.error('❌ [AuthService] Invalid token expiry format:', error)
      return false
    }
  }

  /**
   * Clear all authentication data (logout)
   */
  async clearAuthData(): Promise<void> {
    try {
      await this.storage.remove('dashboardAuth')
      await this.storage.remove('userData')
      await this.storage.remove('campaigns')
      await this.storage.remove('selectedCampaign')
      
      console.log('✅ [AuthService] Auth data cleared')
    } catch (error) {
      console.error('❌ [AuthService] Failed to clear auth data:', error)
      throw error
    }
  }

  /**
   * Open dashboard login page
   */
  async openLoginPage(): Promise<void> {
    try {
      const loginUrl = `${this.config.dashboardUrl}/login`
      await chrome.tabs.create({ url: loginUrl })
      console.log('🔗 [AuthService] Login page opened:', loginUrl)
    } catch (error) {
      console.error('❌ [AuthService] Failed to open login page:', error)
      throw error
    }
  }

  /**
   * Manual refresh from dashboard - using existing auth check function
   */
  async refreshFromDashboard(): Promise<boolean> {
    try {
      console.log('🔄 [AuthService] Refreshing auth from dashboard...')
      
      // Find dashboard tabs
      const tabs = await chrome.tabs.query({ 
        url: `${this.config.dashboardUrl}/*` 
      })
      
      if (tabs.length === 0) {
        console.log('❌ [AuthService] No dashboard tabs found')
        return false
      }

      // Inject script to extract auth data
      const tab = tabs[0]
      if (!tab.id) return false

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try {
            const accessToken = localStorage.getItem('accessToken')
            const refreshToken = localStorage.getItem('refreshToken')
            const tokenExpiry = localStorage.getItem('tokenExpiry')
            const user = localStorage.getItem('user')
            const company = localStorage.getItem('company')
            const roles = localStorage.getItem('roles')

            if (!accessToken || !user) {
              return { success: false }
            }

            return {
              success: true,
              authData: {
                accessToken,
                refreshToken: refreshToken || '',
                tokenExpiry: tokenExpiry || '',
                user,
                company: company || '',
                roles: roles || ''
              }
            }
          } catch (error) {
            return { success: false }
          }
        }
      })

      if (results?.[0]?.result?.success) {
        const authData = results[0].result.authData
        
        // Save auth data using existing storage keys
        await this.storage.set('dashboardAuth', authData)
        
        // Create user data
        const userData = JSON.parse(authData.user)
        const companyData = authData.company ? JSON.parse(authData.company) : null

        const formattedUserData: UserData = {
          id: userData.id,
          fullName: userData.full_name || 
                    (userData.first_name && userData.last_name ? 
                     `${userData.first_name} ${userData.last_name}` : 
                     userData.email || 'User'),
          email: userData.email,
          companyName: companyData?.name || 'Company',
          companyId: companyData?.id || '',
          isAuthenticated: true,
          lastUpdated: Date.now()
        }
        
        await this.storage.set('userData', formattedUserData)
        
        console.log('✅ [AuthService] Auth refreshed successfully')
        return true
      }

      return false
    } catch (error) {
      console.error('❌ [AuthService] Failed to refresh from dashboard:', error)
      return false
    }
  }
}