// popup.tsx - Final popup with Instagram profile integration
import React, { useState, useEffect } from 'react'
import { LoginButton } from './src/popup/components/LoginButton'
import { LoadingSpinner } from './src/popup/components/LoadingSpinner'
import { CampaignSelector } from './src/popup/components/CampaignSelector'
import { InstagramProfile } from './src/popup/components/InstagramProfile'
import { AuthService } from './src/services/auth'
import { InstagramService } from './src/services/instagram'
import type { UserData } from './src/types/auth'
import type { Campaign } from './src/types/campaigns'
import type { InstagramProfile as InstagramProfileType, ProfileDisplayData } from './src/types/instagram'
import './src/popup/styles.css'
import './src/popup/components/CampaignSelector.css'
import './src/popup/components/InstagramProfile.css'

function IndexPopup() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Campaign state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  // Instagram state
  const [instagramProfile, setInstagramProfile] = useState<InstagramProfileType | null>(null)
  const [instagramDisplayData, setInstagramDisplayData] = useState<ProfileDisplayData | null>(null)
  const [isOnInstagram, setIsOnInstagram] = useState(false)
  const [isAddingToList, setIsAddingToList] = useState(false)

  // Services
  const authService = new AuthService()
  const instagramService = new InstagramService()

  useEffect(() => {
    initializePopup()
    setupInstagramProfileListener()
  }, [])

  const initializePopup = async () => {
    try {
      console.log('🚀 [Popup] Initializing popup...')
      
      // Check authentication status
      const authStatus = await authService.isAuthenticated()
      setIsAuthenticated(authStatus)
      
      if (authStatus) {
        // Get user data if authenticated
        const cachedUserData = await authService.getUserData()
        setUserData(cachedUserData)
        console.log('✅ [Popup] User data loaded:', cachedUserData?.fullName)
      }

      // Check if on Instagram and load current profile
      const onInstagram = await instagramService.isOnInstagram()
      setIsOnInstagram(onInstagram)

      if (onInstagram && authStatus) {
        await loadInstagramProfile()
      }
    } catch (error) {
      console.error('❌ [Popup] Failed to initialize popup:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const setupInstagramProfileListener = () => {
    // Listen for Instagram profile updates from content script
    const messageListener = (message: any, sender: any, sendResponse: any) => {
      if (message.type === 'INSTAGRAM_PROFILE_UPDATE') {
        console.log('📱 [Popup] Instagram profile update received')
        handleInstagramProfileUpdate(message.data)
      }
    }

    chrome.runtime.onMessage.addListener(messageListener)

    // Cleanup listener on unmount
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener)
    }
  }

  const loadInstagramProfile = async () => {
    try {
      const profile = await instagramService.getCurrentProfile()
      handleInstagramProfileUpdate(profile)
    } catch (error) {
      console.error('❌ [Popup] Failed to load Instagram profile:', error)
    }
  }

  const handleInstagramProfileUpdate = (profile: InstagramProfileType | null) => {
    setInstagramProfile(profile)
    
    if (profile) {
      const displayData = instagramService.formatProfileForDisplay(profile)
      setInstagramDisplayData(displayData)
      console.log('✅ [Popup] Instagram profile updated:', profile.username)
    } else {
      setInstagramDisplayData(null)
      console.log('❌ [Popup] Instagram profile cleared')
    }
  }

  const handleLogin = async () => {
    try {
      setLoginLoading(true)
      await authService.openLoginPage()
      
      // Close popup after opening login page
      setTimeout(() => {
        window.close()
      }, 500)
    } catch (error) {
      console.error('❌ [Popup] Failed to open login page:', error)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleRefresh = async () => {
    try {
      setRefreshing(true)
      console.log('🔄 [Popup] Manual refresh triggered')
      
      // Try to refresh auth from dashboard
      const authFound = await authService.refreshFromDashboard()
      
      if (authFound) {
        console.log('✅ [Popup] Auth refreshed successfully')
        setIsAuthenticated(true)
        const refreshedUserData = await authService.getUserData()
        setUserData(refreshedUserData)
      } else {
        console.log('❌ [Popup] No auth found during refresh')
        setIsAuthenticated(false)
        setUserData(null)
      }
    } catch (error) {
      console.error('❌ [Popup] Failed to refresh:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleLogout = async () => {
    try {
      console.log('🚪 [Popup] Logging out...')
      await authService.clearAuthData()
      setIsAuthenticated(false)
      setUserData(null)
      setSelectedCampaign(null)
    } catch (error) {
      console.error('❌ [Popup] Failed to logout:', error)
    }
  }

  const handleDataRefresh = async () => {
    try {
      setLoading(true)
      console.log('🔄 [Popup] Refreshing user data...')
      
      const refreshedUserData = await authService.getUserData()
      setUserData(refreshedUserData)
    } catch (error) {
      console.error('❌ [Popup] Failed to refresh user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignSelect = async (campaignId: string, campaign: Campaign) => {
    try {
      console.log('🎯 [Popup] Campaign selected:', campaign.name)
      setSelectedCampaign(campaign)
    } catch (error) {
      console.error('❌ [Popup] Error handling campaign selection:', error)
    }
  }

  const handleAddToList = async (username: string) => {
    try {
      setIsAddingToList(true)
      console.log('➕ [Popup] Adding to list:', username, 'Campaign:', selectedCampaign?.name)
      
      // TODO: Implement API call to add influencer to campaign list
      // This will be implemented in the next phase
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('✅ [Popup] Successfully added to list:', username)
      
      // Show success message (you can add a toast notification here)
      alert(`Successfully added @${username} to ${selectedCampaign?.name}!`)
      
    } catch (error) {
      console.error('❌ [Popup] Failed to add to list:', error)
      alert('Failed to add to list. Please try again.')
    } finally {
      setIsAddingToList(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    width: '350px',
    height: '500px',
    minWidth: '350px',
    maxWidth: '350px',
    backgroundColor: 'white',
    borderRadius: 0,
    overflowX: 'hidden',
    overflowY: 'auto',
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column'
  }

  // Loading state
  if (loading && isAuthenticated === null) {
    return (
      <div style={containerStyle}>
        <LoadingSpinner />
      </div>
    )
  }

  // Login state
  if (!isAuthenticated) {
    return (
      <div style={containerStyle}>
        <LoginButton 
          onLogin={handleLogin} 
          onRefresh={handleRefresh}
          loading={loginLoading}
          refreshing={refreshing}
        />
      </div>
    )
  }

  // Authenticated state
  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: 'white',
        padding: '16px',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%'
        }}>
          <h1 style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: 0
          }}>
            Echooo Dashboard
          </h1>
          <button
            onClick={handleDataRefresh}
            style={{
              padding: '4px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            title="Refresh data"
            onMouseOver={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseOut={(e) => (e.target as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* User Profile Section - Compact */}
        {userData && (
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#fafafa'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '10px'
                }}>
                  <svg width="16" height="16" fill="#2563eb" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#111827'
                  }}>
                    {userData.fullName}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {userData.companyName}
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  backgroundColor: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  color: '#6b7280',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Logout"
                onMouseOver={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = '#f3f4f6';
                  (e.target as HTMLElement).style.color = '#374151'
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  (e.target as HTMLElement).style.color = '#6b7280'
                }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Campaign Selector */}
        <CampaignSelector onCampaignSelect={handleCampaignSelect} />

        {/* Instagram Profile Section */}
        {instagramDisplayData && (
          <div style={{ padding: '0 16px 16px' }}>
            <InstagramProfile 
              profile={instagramDisplayData}
              onAddToList={handleAddToList}
              isAddingToList={isAddingToList}
              selectedCampaignName={selectedCampaign?.name}
            />
          </div>
        )}

        {/* Instructions */}
        {!instagramDisplayData && selectedCampaign && (
          <div style={{
            padding: '16px',
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f8fafc'
          }}>
            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Visit an Instagram profile to add influencers to your selected campaign
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px',
        backgroundColor: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <span>Extension v1.0.0</span>
          <button
            onClick={() => {
              const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
              chrome.tabs.create({ url: dashboardUrl })
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              cursor: 'pointer',
              fontSize: '12px',
              textDecoration: 'none'
            }}
            onMouseOver={(e) => (e.target as HTMLElement).style.color = '#1d4ed8'}
            onMouseOut={(e) => (e.target as HTMLElement).style.color = '#2563eb'}
          >
            Open Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}

export default IndexPopup