// src/services/instagram-api.ts
// Service for Instagram API calls to backend

import { AuthService } from './auth'

export interface InstagramCreatorProfile {
  id: string
  username: string
  name: string
  profileImage: string
  followers: number
  following_count: number
  engagementRate: number
  isVerified: boolean
  content_count: number
  url: string
  category: string
  work_platform: {
    id: string
    name: string
    logo_url: string
  }
}

export interface AddToListPayload {
  campaign_list_id: string
  platform_id: string
  social_data: {
    id: string
    username: string
    name: string
    profileImage: string
    followers: string
    isVerified: boolean
    account_url: string
    additional_metrics: InstagramCreatorProfile
  }
}

export class InstagramApiService {
  private dashboardBaseUrl: string
  private apiBaseUrl: string
  private authService: AuthService

  constructor() {
    this.dashboardBaseUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    this.apiBaseUrl = process.env.PLASMO_PUBLIC_API_BASE_URL_Local || 'http://localhost:8000/api/v0'
    this.authService = new AuthService()
  }

  /**
   * Get creator profile from dashboard API
   */
  // Replace the getCreatorProfile method in instagram-api.ts
async getCreatorProfile(username: string): Promise<InstagramCreatorProfile | null> {
  try {
    console.log('🔍 [InstagramApi] Fetching creator profile for:', username)
    
    // Get auth data from storage instead
    const { Storage } = await import("@plasmohq/storage")
    const storage = new Storage()
    const accessToken = await this.authService.getAccessToken()
      if (!accessToken) {
        console.error('❌ [CampaignsService] No access token available')
        return []
      }

    const url = new URL(`${this.dashboardBaseUrl}/api/v0/social/creators/profiles`)
    url.searchParams.set('username', username)
    url.searchParams.set('platform', 'instagram')
    url.searchParams.set('include_detailed_info', 'true')

    console.log('📡 [InstagramApi] Calling GET:', url.toString())

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('❌ [InstagramApi] GET request failed:', response.status, response.statusText)
      return null
    }

    const result = await response.json()
    console.log('✅ [InstagramApi] Creator profile response:', result)

    if (result.success && result.data) {
      return result.data
    }

    return null
  } catch (error) {
    console.error('❌ [InstagramApi] Error fetching creator profile:', error)
    return null
  }
}

  /**
   * Add creator to campaign list
   */
  async addCreatorToCampaign(campaignListId: string, creatorProfile: InstagramCreatorProfile): Promise<boolean> {
  try {
    console.log('📝 [InstagramApi] Adding creator to campaign:', campaignListId, creatorProfile.username)

    // Get auth data from storage
    const { Storage } = await import("@plasmohq/storage")
    const storage = new Storage()
    const accessToken = await this.authService.getAccessToken()
      if (!accessToken) {
        console.error('❌ [CampaignsService] No access token available')
        return []
      }

    const payload: AddToListPayload = {
      campaign_list_id: campaignListId,
      platform_id: "ac9dbbb9-3750-40bb-bd98-edf587cbf4ba", // Instagram platform ID
      social_data: {
        id: creatorProfile.id,
        username: creatorProfile.username,
        name: creatorProfile.name,
        profileImage: creatorProfile.profileImage,
        followers: creatorProfile.followers.toString(),
        isVerified: creatorProfile.isVerified,
        account_url: creatorProfile.url,
        additional_metrics: creatorProfile
      }
    }

    const postUrl = `${this.apiBaseUrl}/campaign-influencers/`
    console.log('📡 [InstagramApi] POST URL:', postUrl)
    console.log('📡 [InstagramApi] Payload:', JSON.stringify(payload, null, 2))
    console.log('📡 [InstagramApi] Headers:', {
      'Authorization': `Bearer ${accessToken.substring(0, 20)}...`,
      'Content-Type': 'application/json'
    })

    const response = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': `chrome-extension://${chrome.runtime.id}`
      },
      body: JSON.stringify(payload)
    })

    console.log('📡 [InstagramApi] Response status:', response.status)
    console.log('📡 [InstagramApi] Response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [InstagramApi] POST request failed:', response.status, response.statusText)
      console.error('❌ [InstagramApi] Error response:', errorText)
      return false
    }

    const result = await response.json()
    console.log('✅ [InstagramApi] Creator added to campaign:', result)

    return true
  } catch (error) {
    console.error('❌ [InstagramApi] Error adding creator to campaign:', error)
    console.error('❌ [InstagramApi] Error details:', error.message, error.stack)
    return false
  }
}

  /**
   * Complete add to list workflow
   */
  async addToList(username: string, campaignListId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🚀 [InstagramApi] Starting add to list workflow for:', username)

      // Step 1: Get creator profile
      const creatorProfile = await this.getCreatorProfile(username)
      if (!creatorProfile) {
        return { success: false, error: 'Creator profile not found' }
      }

      // Step 2: Add to campaign
      const added = await this.addCreatorToCampaign(campaignListId, creatorProfile)
      if (!added) {
        return { success: false, error: 'Failed to add creator to campaign' }
      }

      console.log('✅ [InstagramApi] Successfully added to list')
      return { success: true }

    } catch (error) {
      console.error('❌ [InstagramApi] Add to list workflow failed:', error)
      return { success: false, error: 'Unexpected error occurred' }
    }
  }
}