// src/lib/campaignsApi.ts
// API service for fetching campaigns data
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

export interface Campaign {
  id: string
  name: string
  brand_name: string
  status: {
    id: string
    name: string
  }
  campaign_lists: Array<{
    id: string
    name: string
    total_influencers_count: number
    total_contacted_count: number
    total_onboarded_count: number
  }>
  created_at: string
  budget: number
  category: {
    id: string
    name: string
  }
}

export interface CampaignsResponse {
  success: boolean
  data: Campaign[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

/**
 * Fetch campaigns for the authenticated user's company
 */
export async function fetchCampaigns(): Promise<Campaign[]> {
  try {
    console.log('📋 Fetching campaigns...')
    
    // Get auth data from storage
    const dashboardAuth = await storage.get('dashboardAuth')
    const userData = await storage.get('userData')
    
    if (!dashboardAuth?.accessToken || !userData) {
      console.error('❌ No auth data available for campaigns API')
      return []
    }
    
    // Parse company data to get company_id
    let companyId: string
    try {
      const companyData = dashboardAuth.company ? JSON.parse(dashboardAuth.company) : null
      companyId = companyData?.id
      
      if (!companyId) {
        console.error('❌ No company ID found in auth data')
        return []
      }
    } catch (parseError) {
      console.error('❌ Error parsing company data:', parseError)
      return []
    }
    
    // Make API request
    const apiUrl = `http://localhost:3000/api/v0/campaigns/company/${companyId}`
    console.log(`🌐 Calling campaigns API: ${apiUrl}`)
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dashboardAuth.accessToken}`,
      },
    })
    
    if (!response.ok) {
      console.error(`❌ Campaigns API error: ${response.status} ${response.statusText}`)
      return []
    }
    
    const result: CampaignsResponse = await response.json()
    console.log(`✅ Campaigns API success: Found ${result.data?.length || 0} campaigns`)
    
    if (result.success && result.data) {
      // Cache campaigns in storage for quick access
      await storage.set('campaigns', result.data)
      return result.data
    } else {
      console.error('❌ Invalid campaigns API response format')
      return []
    }
    
  } catch (error) {
    console.error('❌ Error fetching campaigns:', error)
    return []
  }
}

/**
 * Get cached campaigns from storage
 */
export async function getCachedCampaigns(): Promise<Campaign[]> {
  try {
    const campaigns = await storage.get('campaigns')
    return campaigns || []
  } catch (error) {
    console.error('❌ Error getting cached campaigns:', error)
    return []
  }
}

/**
 * Format campaign data for display
 */
export function formatCampaignForDisplay(campaign: Campaign) {
  const firstList = campaign.campaign_lists?.[0]
  
  return {
    id: campaign.id,
    name: campaign.name,
    brandName: campaign.brand_name,
    status: campaign.status?.name || 'unknown',
    statusId: campaign.status?.id,
    totalInfluencers: firstList?.total_influencers_count || 0,
    totalContacted: firstList?.total_contacted_count || 0,
    totalOnboarded: firstList?.total_onboarded_count || 0,
    createdAt: campaign.created_at,
    budget: campaign.budget,
    category: campaign.category?.name || 'Uncategorized'
  }
}

/**
 * Get formatted date string
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    return 'Invalid date'
  }
}

/**
 * Get status color for campaign status
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
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