// contents/dashboard.ts
// Content script that runs on your dashboard domain to access localStorage

import { sendToBackground } from "@plasmohq/messaging"

console.log("🔍 Echooo Dashboard content script loaded")

// Check if we're on the dashboard domain
const isDashboardDomain = () => {
  const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
  return window.location.origin === dashboardUrl.replace(/\/$/, '')
}

// Function to extract auth data from localStorage
const extractAuthData = () => {
  try {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const tokenExpiry = localStorage.getItem('tokenExpiry')
    const user = localStorage.getItem('user')
    const company = localStorage.getItem('company')
    const roles = localStorage.getItem('roles')

    console.log('📊 Dashboard localStorage data found:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUser: !!user,
      hasCompany: !!company,
      tokenExpiry: tokenExpiry ? new Date(parseInt(tokenExpiry)).toISOString() : null
    })

    if (!accessToken || !user) {
      return null
    }

    return {
      accessToken,
      refreshToken,
      tokenExpiry,
      user,
      company,
      roles
    }
  } catch (error) {
    console.error('❌ Failed to extract auth data:', error)
    return null
  }
}

// Function to send auth data to extension
const sendAuthDataToExtension = async () => {
  const authData = extractAuthData()
  
  if (authData) {
    console.log('✅ Sending auth data to extension background')
    
    try {
      const response = await sendToBackground({
        name: "cache-dashboard-auth",
        body: authData
      })
      
      console.log('📨 Background response:', response)
    } catch (error) {
      console.error('❌ Failed to send auth data:', error)
    }
  } else {
    console.log('⚠️ No valid auth data found in localStorage')
  }
}

// Main execution
if (isDashboardDomain()) {
  console.log('✅ Content script running on dashboard domain')
  
  // Send auth data immediately
  sendAuthDataToExtension()
  
  // Monitor localStorage changes
  const originalSetItem = localStorage.setItem
  localStorage.setItem = function(key: string, value: string) {
    originalSetItem.apply(this, [key, value])
    
    // If auth-related key changed, update extension
    if (['accessToken', 'refreshToken', 'user', 'company', 'roles'].includes(key)) {
      console.log(`🔄 localStorage updated: ${key}`)
      setTimeout(sendAuthDataToExtension, 100) // Small delay to ensure all related data is updated
    }
  }

  // Monitor for login/logout events
  window.addEventListener('storage', (e) => {
    if (['accessToken', 'refreshToken', 'user', 'company', 'roles'].includes(e.key || '')) {
      console.log(`🔄 Storage event detected: ${e.key}`)
      setTimeout(sendAuthDataToExtension, 100)
    }
  })

  // Also check periodically (every 5 seconds)
  setInterval(sendAuthDataToExtension, 5000)
  
  console.log('✅ Dashboard monitoring setup complete')
} else {
  console.log('ℹ️ Content script not on dashboard domain, skipping auth monitoring')
}

export {}