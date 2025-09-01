// src/services/campaigns.ts
// Fixed campaigns service with proper imports

import { Storage } from "@plasmohq/storage"
import { getApiEndpoints } from '../config'
import { AuthService } from './auth'
import type { Campaign, CampaignsApiResponse, CampaignDisplay } from '../types/campaigns'

export class CampaignsService {
  private storage: Storage
  private authService: AuthService
  private apiEndpoints: ReturnType<typeof getApiEndpoints>

  constructor() {
    this.storage = new Storage()
    this.authService = new AuthService()
    this.apiEndpoints = getApiEndpoints()
  }

  /**
   * Fetch campaigns from API with detailed logging
   */
  async fetchCampaigns(): Promise<Campaign[]> {
    try {
      console.log('📋 [CampaignsService] Starting to fetch campaigns...')
      
      // Get auth token
      const accessToken = await this.authService.getAccessToken()
      if (!accessToken) {
        console.error('❌ [CampaignsService] No access token available')
        return []
      }

      // Get company ID
      const companyId = await this.authService.getCompanyId()
      if (!companyId) {
        console.error('❌ [CampaignsService] No company ID available')
        return []
      }

      // Build API URL
      const apiUrl = `${this.apiEndpoints.campaigns}/company/${companyId}`
      console.log('🌐 [CampaignsService] API URL:', apiUrl)

      // Make API request
      console.log('📡 [CampaignsService] Making API request...')
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      console.log('📨 [CampaignsService] Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [CampaignsService] API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        return []
      }

      // Parse response
      const responseText = await response.text()
      console.log('📄 [CampaignsService] Raw response length:', responseText.length)

      let result: CampaignsApiResponse
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ [CampaignsService] JSON parse error:', parseError)
        return []
      }

      console.log('✅ [CampaignsService] Parsed response:', {
        success: result.success,
        dataLength: result.data?.length || 0
      })

      if (result.success && result.data && Array.isArray(result.data)) {
        console.log(`✅ [CampaignsService] Successfully fetched ${result.data.length} campaigns`)
        
        // Cache campaigns
        await this.cacheCampaigns(result.data)
        return result.data
      } else {
        console.error('❌ [CampaignsService] Invalid API response format')
        return []
      }

    } catch (error) {
      console.error('❌ [CampaignsService] Fetch campaigns error:', error)
      return []
    }
  }

  /**
   * Get cached campaigns from storage
   */
  async getCachedCampaigns(): Promise<Campaign[]> {
    try {
      const campaigns = await this.storage.get('campaigns')
      const cachedCampaigns = Array.isArray(campaigns) ? campaigns as Campaign[] : []
      console.log(`📄 [CampaignsService] Retrieved ${cachedCampaigns.length} cached campaigns`)
      return cachedCampaigns
    } catch (error) {
      console.error('❌ [CampaignsService] Failed to get cached campaigns:', error)
      return []
    }
  }

  /**
   * Cache campaigns in storage
   */
  private async cacheCampaigns(campaigns: Campaign[]): Promise<void> {
    try {
      await this.storage.set('campaigns', campaigns)
      await this.storage.set('lastSync', Date.now())
      console.log(`✅ [CampaignsService] Cached ${campaigns.length} campaigns`)
    } catch (error) {
      console.error('❌ [CampaignsService] Failed to cache campaigns:', error)
    }
  }

  /**
   * Get campaigns with cache management
   */
  async getCampaigns(forceRefresh = false): Promise<Campaign[]> {
    try {
      console.log(`🔄 [CampaignsService] Getting campaigns (forceRefresh: ${forceRefresh})`)
      
      if (!forceRefresh) {
        const cachedCampaigns = await this.getCachedCampaigns()
        
        if (cachedCampaigns.length > 0) {
          console.log('📄 [CampaignsService] Using cached campaigns')
          return cachedCampaigns
        }
      }

      // Fetch fresh data
      console.log('📡 [CampaignsService] Fetching fresh campaigns')
      return await this.fetchCampaigns()

    } catch (error) {
      console.error('❌ [CampaignsService] Get campaigns error:', error)
      return []
    }
  }

  /**
   * Format campaign data for display in UI
   */
  formatCampaignForDisplay(campaign: Campaign): CampaignDisplay {
    const firstList = campaign.campaign_lists?.[0]
    
    return {
      id: campaign.id,
      name: campaign.name,
      brandName: campaign.brand_name,
      status: campaign.status?.name || 'unknown',
      statusColor: this.getStatusColor(campaign.status?.name || 'unknown'),
      totalInfluencers: firstList?.total_influencers_count || 0,
      totalContacted: firstList?.total_contacted_count || 0,
      totalOnboarded: firstList?.total_onboarded_count || 0,
      createdAt: campaign.created_at,
      formattedDate: this.formatDate(campaign.created_at),
      budget: campaign.budget || 0,
      category: campaign.category?.name || 'Uncategorized',
      completionPercentage: firstList?.completion_percentage || 0
    }
  }

  /**
   * Get status color for campaign status
   */
  private getStatusColor(status: string): string {
    const statusLower = status.toLowerCase()
    
    switch (statusLower) {
      case 'active':
        return '#10b981' // green
      case 'draft':
        return '#f59e0b' // yellow
      case 'paused':
        return '#ef4444' // red
      case 'completed':
        return '#6b7280' // gray
      default:
        return '#6b7280' // gray
    }
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      console.error('❌ [CampaignsService] Date formatting error:', error)
      return 'Invalid date'
    }
  }

  /**
   * Save selected campaign ID
   */
  async saveSelectedCampaign(campaignId: string): Promise<void> {
    try {
      await this.storage.set('selectedCampaign', campaignId)
      console.log('✅ [CampaignsService] Selected campaign saved:', campaignId)
    } catch (error) {
      console.error('❌ [CampaignsService] Failed to save selected campaign:', error)
    }
  }
}