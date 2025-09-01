// src/lib/api.ts
// API client for communicating with FastAPI backend
// Updated to work with your dashboard's localStorage authentication

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

interface User {
  id: string
  full_name: string
  email: string
  company_name: string
  user_type: string
  status: string
}

interface Campaign {
  id: string
  name: string
  status: string
  created_at: string
}

interface DashboardAuthData {
  accessToken: string
  refreshToken: string
  tokenExpiry: string
  user: string // JSON string
  company: string // JSON string
  roles: string // JSON string
}

class ApiClient {
  private baseUrl: string
  
  constructor() {
    this.baseUrl = process.env.PLASMO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v0'
  }

  /**
   * Check if we can access dashboard localStorage (when on dashboard domain)
   */
  private async getDashboardAuthData(): Promise<DashboardAuthData | null> {
    try {
      // First try to get data from extension storage (if we've cached it)
      const { Storage } = await import("@plasmohq/storage")
      const storage = new Storage()
      
      const cachedAuthData = await storage.get('dashboardAuth')
      if (cachedAuthData) {
        const authData = typeof cachedAuthData === 'string' ? JSON.parse(cachedAuthData) : cachedAuthData
        if (this.isTokenValid(authData.tokenExpiry)) {
          return authData
        }
      }

      return null
    } catch (error) {
      console.error('❌ Failed to get dashboard auth data:', error)
      return null
    }
  }

  /**
   * Check if token is still valid
   */
  private isTokenValid(tokenExpiry: string): boolean {
    if (!tokenExpiry) return false
    return Date.now() < parseInt(tokenExpiry, 10)
  }

  /**
   * Make authenticated request to FastAPI backend
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const authData = await this.getDashboardAuthData()
      
      if (!authData || !authData.accessToken) {
        return {
          success: false,
          error: 'No authentication token available'
        }
      }

      const url = `${this.baseUrl}${endpoint}`
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.accessToken}`,
          ...options.headers,
        },
      })

      if (!response.ok) {
        // If 401, try to refresh token
        if (response.status === 401 && authData.refreshToken) {
          const refreshed = await this.refreshAuthToken(authData.refreshToken)
          if (refreshed) {
            // Retry with new token
            return this.makeRequest(endpoint, options)
          }
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('❌ API Request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(refreshToken: string): Promise<boolean> {
    try {
      const formData = new FormData()
      formData.append('refresh_token', refreshToken)
      
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        return false
      }

      const authData = await response.json()
      
      // Update stored auth data
      const { Storage } = await import("@plasmohq/storage")
      const storage = new Storage()
      
      await storage.set('dashboardAuth', {
        accessToken: authData.access_token,
        refreshToken: authData.refresh_token,
        tokenExpiry: (Date.now() + authData.expires_in * 1000).toString(),
        user: JSON.stringify(authData.user),
        company: JSON.stringify(authData.company),
        roles: JSON.stringify(authData.roles)
      })

      return true
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      return false
    }
  }

  /**
   * Cache dashboard authentication data from content script
   */
  async cacheAuthFromDashboard(): Promise<boolean> {
    try {
      // This will be called from content script when on dashboard domain
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'CACHE_DASHBOARD_AUTH'
        }, (response) => {
          resolve(response?.success || false)
        })
      })
    } catch (error) {
      console.error('❌ Failed to cache auth from dashboard:', error)
      return false
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.makeRequest<User>('/users/current')
  }

  /**
   * Get user's campaigns  
   */
  async getUserCampaigns(): Promise<ApiResponse<Campaign[]>> {
    return this.makeRequest<Campaign[]>('/campaigns')
  }

  /**
   * Check authentication status
   */
  async checkAuth(): Promise<ApiResponse<{ authenticated: boolean }>> {
    const authData = await this.getDashboardAuthData()
    
    if (!authData || !authData.accessToken) {
      return {
        success: true,
        data: { authenticated: false }
      }
    }

    if (!this.isTokenValid(authData.tokenExpiry)) {
      return {
        success: true,
        data: { authenticated: false }
      }
    }

    // Verify with backend
    return this.makeRequest<{ authenticated: boolean }>('/auth/check')
  }

  /**
   * Get user profile and company information
   */
  async getUserProfile(): Promise<ApiResponse<{
    user: User
    campaigns: Campaign[]
  }>> {
    try {
      // Fetch both user and campaigns data
      const [userResponse, campaignsResponse] = await Promise.all([
        this.getCurrentUser(),
        this.getUserCampaigns()
      ])

      if (!userResponse.success || !campaignsResponse.success) {
        return {
          success: false,
          error: userResponse.error || campaignsResponse.error || 'Failed to fetch profile data'
        }
      }

      return {
        success: true,
        data: {
          user: userResponse.data!,
          campaigns: campaignsResponse.data!
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch profile'
      }
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types
export type { User, Campaign, ApiResponse }