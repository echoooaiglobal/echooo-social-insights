// src/popup/components/InstagramProfile.tsx
import React from 'react'
import { ExternalLink, Users, Image, Shield, ShieldCheck, Plus } from 'lucide-react'
import type { ProfileDisplayData } from '../../types/instagram'

interface InstagramProfileProps {
  profile: ProfileDisplayData
  onAddToList?: (username: string) => void
  isAddingToList?: boolean
  selectedCampaignName?: string
}

export function InstagramProfile({ 
  profile, 
  onAddToList, 
  isAddingToList = false,
  selectedCampaignName 
}: InstagramProfileProps) {
  
  const handleAddToList = () => {
    if (onAddToList && profile.canAddToList) {
      onAddToList(profile.username)
    }
  }

  return (
    <div className="instagram-profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <h3 className="profile-header-title">Instagram Profile</h3>
          <button
            onClick={() => window.open(profile.url, '_blank')}
            className="external-link-button"
            title="Open on Instagram"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {/* Profile Picture and Basic Info */}
        <div className="profile-basic-info">
          <div className="profile-picture-container">
            {profile.profilePicture ? (
              <img 
                src={profile.profilePicture} 
                alt={profile.displayName}
                className="profile-picture"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlNWU3ZWIiLz48cGF0aCBkPSJNMjAgMjBjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTQtNCAxLjc5LTQgNGMwIDIuMjEgMS43OSA0IDQgNHptMCAyYy0yLjY3IDAtOCAxLjM0LTggNHYyaDE2di0yYzAtMi42Ni01LjMzLTQtOC00eiIgZmlsbD0iIzZiNzI4MCIvPjwvc3ZnPg=='
                }}
              />
            ) : (
              <div className="profile-picture-placeholder">
                <Users size={20} />
              </div>
            )}
            
            {profile.isVerified && (
              <div className="verification-badge" title="Verified Account">
                <ShieldCheck size={12} />
              </div>
            )}
            
            {profile.isPrivate && (
              <div className="private-badge" title="Private Account">
                <Shield size={12} />
              </div>
            )}
          </div>

          <div className="profile-text-info">
            <div className="profile-name-container">
              <h4 className="profile-display-name">{profile.displayName}</h4>
              <span className="profile-username">@{profile.username}</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="profile-stats">
          <div className="stat-item">
            <Image size={14} className="stat-icon" />
            <span className="stat-label">Posts</span>
            <span className="stat-value">{profile.formattedPosts}</span>
          </div>
          
          <div className="stat-item">
            <Users size={14} className="stat-icon" />
            <span className="stat-label">Followers</span>
            <span className="stat-value">{profile.formattedFollowers}</span>
          </div>
          
          <div className="stat-item">
            <Users size={14} className="stat-icon" />
            <span className="stat-label">Following</span>
            <span className="stat-value">{profile.formattedFollowing}</span>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="profile-metrics">
          <div className="metric-item">
            <span className="metric-label">Engagement Rate</span>
            <span className="metric-value">{profile.engagementRate || '~2.5%'}</span>
          </div>
          
          <div className="metric-item">
            <span className="metric-label">Influence Tier</span>
            <span className="metric-value">{profile.influenceTier || 'Mega Influencer'}</span>
          </div>
        </div>

        {/* Location */}
        {profile.location && (
          <div className="profile-location">
            <span className="location-icon">📍</span>
            <span className="location-text">{profile.location}</span>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="profile-bio">
            <p className="bio-text">{profile.bio}</p>
          </div>
        )}

        {/* Add to List Button */}
        {profile.canAddToList && selectedCampaignName ? (
          <div className="add-to-list-section">
            <button
              onClick={handleAddToList}
              disabled={isAddingToList}
              className="add-to-list-button"
            >
              <Plus size={16} className={`add-icon ${isAddingToList ? 'spinning' : ''}`} />
              <span>
                {isAddingToList 
                  ? 'Adding...' 
                  : `Add to ${selectedCampaignName}`
                }
              </span>
            </button>
          </div>
        ) : profile.isPrivate ? (
          <div className="add-to-list-section">
            <div className="private-account-notice">
              <Shield size={16} />
              <span>Private accounts cannot be added to campaigns</span>
            </div>
          </div>
        ) : !selectedCampaignName ? (
          <div className="add-to-list-section">
            <div className="no-campaign-notice">
              <span>Select a campaign above to add this profile</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}