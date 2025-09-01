// src/types/campaigns.ts
// Campaign related types

export interface CampaignStatus {
  id: string
  name: string
}

export interface CampaignCategory {
  id: string
  name: string
}

export interface CampaignList {
  id: string
  name: string
  description?: string
  total_influencers_count: number
  total_contacted_count: number
  total_onboarded_count: number
  avg_collaboration_price?: number
  completion_percentage: number
  days_since_created: number
  last_activity_date: string
}

export interface Campaign {
  id: string
  company_id: string
  name: string
  description?: string
  brand_name: string
  category_id: string
  audience_age_group?: string
  budget: number
  currency_code?: string
  status_id: string
  start_date?: string
  end_date?: string
  created_by: string
  default_filters: boolean
  is_deleted: boolean
  deleted_at?: string
  deleted_by?: string
  created_at: string
  updated_at: string
  category: CampaignCategory
  status: CampaignStatus
  campaign_lists: CampaignList[]
}

export interface CampaignsApiResponse {
  success: boolean
  data: Campaign[]
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface CampaignDisplay {
  id: string
  name: string
  brandName: string
  status: string
  statusColor: string
  totalInfluencers: number
  totalContacted: number
  totalOnboarded: number
  createdAt: string
  formattedDate: string
  budget: number
  category: string
  completionPercentage: number
}