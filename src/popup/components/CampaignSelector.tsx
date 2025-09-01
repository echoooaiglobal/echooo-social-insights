// src/popup/components/CampaignSelector.tsx
import React, { useState, useEffect } from 'react'
import { ChevronDown, Folder, Users, MessageCircle, Calendar, Target, RefreshCw, AlertCircle } from 'lucide-react'
import { CampaignsService } from '../../services/campaigns'
import type { Campaign, CampaignDisplay } from '../../types/campaigns'

interface CampaignSelectorProps {
  onCampaignSelect?: (campaignId: string, campaign: Campaign) => void
}

export function CampaignSelector({ onCampaignSelect }: CampaignSelectorProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [selectedDisplay, setSelectedDisplay] = useState<CampaignDisplay | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const campaignsService = new CampaignsService()

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async (forceRefresh = false) => {
    try {
      setLoading(!forceRefresh)
      setRefreshing(forceRefresh)
      setError(null)
      
      console.log('🔄 [CampaignSelector] Loading campaigns...')
      
      const campaignsList = await campaignsService.getCampaigns(forceRefresh)
      console.log(`✅ [CampaignSelector] Loaded ${campaignsList.length} campaigns`)
      
      setCampaigns(campaignsList)
      
      // Auto-select first campaign if available
      if (campaignsList.length > 0 && !selectedCampaign) {
        handleCampaignSelect(campaignsList[0])
      } else if (campaignsList.length === 0) {
        setSelectedCampaign(null)
        setSelectedDisplay(null)
      }
      
    } catch (err) {
      console.error('❌ [CampaignSelector] Error loading campaigns:', err)
      setError('Failed to load campaigns')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCampaignSelect = (campaign: Campaign) => {
    try {
      console.log('✅ [CampaignSelector] Campaign selected:', campaign.name)
      
      setSelectedCampaign(campaign)
      setIsDropdownOpen(false)
      
      // Format campaign for display
      const displayData = campaignsService.formatCampaignForDisplay(campaign)
      setSelectedDisplay(displayData)
      
      // Save selection and notify parent
      campaignsService.saveSelectedCampaign(campaign.id)
      onCampaignSelect?.(campaign.id, campaign)
      
    } catch (error) {
      console.error('❌ [CampaignSelector] Error selecting campaign:', error)
    }
  }

  const handleRefresh = async () => {
    console.log('🔄 [CampaignSelector] Manual refresh triggered')
    await loadCampaigns(true)
  }

  // Loading state
  if (loading) {
    return (
      <div className="campaign-selector-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">Loading campaigns...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="campaign-selector-container">
        <div className="error-container">
          <AlertCircle size={20} className="error-icon" />
          <div className="error-message">{error}</div>
          <button onClick={handleRefresh} className="retry-button">
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    )
  }

  // No campaigns state
  if (campaigns.length === 0) {
    return (
      <div className="campaign-selector-container">
        <div className="no-campaigns-container">
          <Folder size={32} className="no-campaigns-icon" />
          <div className="no-campaigns-text">No campaigns found</div>
          <button onClick={handleRefresh} className="refresh-link">
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="campaign-selector-container">
      {/* Campaign Selector Dropdown */}
      <div className="dropdown-container">
        <label className="dropdown-label">
          Select Campaign
        </label>
        
        <div className="dropdown-wrapper">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="dropdown-button"
            disabled={refreshing}
          >
            <span className="dropdown-text">
              {selectedCampaign ? selectedCampaign.name : 'Choose a campaign...'}
            </span>
            <div className="dropdown-icon-container">
              {refreshing ? (
                <RefreshCw size={16} className="refresh-icon spinning" />
              ) : (
                <ChevronDown 
                  size={16} 
                  className={`dropdown-icon ${isDropdownOpen ? 'rotated' : ''}`}
                />
              )}
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="dropdown-menu">
              {campaigns.map((campaign) => (
                <button
                  key={campaign.id}
                  onClick={() => handleCampaignSelect(campaign)}
                  className={`dropdown-item ${selectedCampaign?.id === campaign.id ? 'selected' : ''}`}
                >
                  <div className="dropdown-item-name">{campaign.name}</div>
                  <div className="dropdown-item-brand">{campaign.brand_name}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Campaign Details */}
      {selectedDisplay && (
        <div className="campaign-details">
          <div className="campaign-header">
            <h3 className="campaign-brand">{selectedDisplay.brandName}</h3>
            <span 
              className="campaign-status"
              style={{ backgroundColor: selectedDisplay.statusColor }}
            >
              {selectedDisplay.status}
            </span>
          </div>

          {/* Campaign Stats Grid */}
          <div className="campaign-stats">
            <div className="stat-item">
              <Users size={14} className="stat-icon" />
              <span className="stat-text">{selectedDisplay.totalInfluencers} influencers</span>
            </div>
            
            <div className="stat-item">
              <MessageCircle size={14} className="stat-icon" />
              <span className="stat-text">{selectedDisplay.totalContacted} contacted</span>
            </div>
            
            <div className="stat-item">
              <Target size={14} className="stat-icon" />
              <span className="stat-text">{selectedDisplay.totalOnboarded} onboarded</span>
            </div>
            
            <div className="stat-item">
              <Calendar size={14} className="stat-icon" />
              <span className="stat-text">{selectedDisplay.formattedDate}</span>
            </div>
          </div>

          {/* Category */}
          <div className="campaign-category">
            {selectedDisplay.category}
          </div>
        </div>
      )}
    </div>
  )
}