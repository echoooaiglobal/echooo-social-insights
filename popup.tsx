// popup.tsx (place this in root directory)
import React, { useState, useEffect } from 'react'
import { LoginButton } from './src/popup/components/LoginButton'
import { LoadingSpinner } from './src/popup/components/LoadingSpinner'
import { UserProfile } from './src/popup/components/UserProfile'
import { CampaignSelector } from './src/popup/components/CampaignSelector'
import { checkAuthentication, getCachedUserData, logout, openLoginPage } from './src/lib/auth'
import type { UserData } from './src/lib/storage'
import './src/popup/styles.css'

// Force popup size on component mount
React.useLayoutEffect = React.useLayoutEffect || React.useEffect

function IndexPopup() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [loginLoading, setLoginLoading] = useState(false)

  // Force popup dimensions
  React.useLayoutEffect(() => {
    const forceSize = () => {
      document.body.style.width = '350px'
      document.body.style.height = '500px'
      document.body.style.minWidth = '350px'
      document.body.style.maxWidth = '350px'
      document.body.style.overflow = 'hidden'
      
      const plasmoRoot = document.getElementById('__plasmo')
      if (plasmoRoot) {
        plasmoRoot.style.width = '350px'
        plasmoRoot.style.height = '500px'
        plasmoRoot.style.minWidth = '350px'
        plasmoRoot.style.maxWidth = '350px'
      }
    }
    
    forceSize()
    setTimeout(forceSize, 100) // Retry after 100ms
    setTimeout(forceSize, 500) // Retry after 500ms
  }, [])

  useEffect(() => {
    initializePopup()
  }, [])

  const initializePopup = async () => {
    try {
      console.log('🚀 Initializing popup...')
      
      // Check authentication status
      const authStatus = await checkAuthentication()
      setIsAuthenticated(authStatus)
      
      if (authStatus) {
        // Get user data if authenticated
        const cachedData = await getCachedUserData()
        setUserData(cachedData)
      }
    } catch (error) {
      console.error('❌ Failed to initialize popup:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    try {
      setLoginLoading(true)
      await openLoginPage()
      
      // Close popup after opening login page
      setTimeout(() => {
        window.close()
      }, 500)
    } catch (error) {
      console.error('❌ Failed to open login page:', error)
    } finally {
      setLoginLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsAuthenticated(false)
      setUserData(null)
    } catch (error) {
      console.error('❌ Failed to logout:', error)
    }
  }

  const handleRefresh = async () => {
    try {
      setLoading(true)
      const refreshedData = await getCachedUserData(true) // Force refresh
      setUserData(refreshedData)
    } catch (error) {
      console.error('❌ Failed to refresh data:', error)
    } finally {
      setLoading(false)
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

  // Show loading spinner while initializing
  if (loading && isAuthenticated === null) {
    return (
      <div style={containerStyle}>
        <LoadingSpinner />
      </div>
    )
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={containerStyle}>
        <LoginButton onLogin={handleLogin} loading={loginLoading} />
      </div>
    )
  }

  // Show main popup content if authenticated
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
            onClick={handleRefresh}
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
        {/* User Profile Section */}
        {userData && (
          <UserProfile userData={userData} onLogout={handleLogout} />
        )}

        {/* Campaign Selector */}
        <CampaignSelector />
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