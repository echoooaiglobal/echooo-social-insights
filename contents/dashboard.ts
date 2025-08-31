// contents/dashboard.ts
// Content script for dashboard domain using PLASMO MESSAGING
import { sendToBackground } from "@plasmohq/messaging"
import type { PlasmoCSConfig } from "plasmo"

// Configure which sites this content script runs on
export const config: PlasmoCSConfig = {
  matches: ["http://localhost:3000/*", "https://yourdashboard.com/*"],
  run_at: "document_end"
}

console.log("🔍 Echooo Dashboard content script loaded (Plasmo)")

// Extract authentication data from dashboard localStorage
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
      console.log('⚠️ Missing required auth data (accessToken or user)')
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

// Send auth data to background script via PLASMO messaging
const sendAuthDataToBackground = async () => {
  const authData = extractAuthData() 
  
  if (authData) {
    console.log('✅ Sending auth data via Plasmo messaging...')
    
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
    console.log('⚠️ No valid auth data found, sending clear signal...')
    
    try {
      await sendToBackground({
        name: "clear-dashboard-auth",
        body: {}
      })
      console.log('🧹 Sent clear auth signal via Plasmo messaging')
    } catch (error) {
      console.error('❌ Failed to send clear auth signal:', error)
    }
  }
}

// Send auth data immediately when script loads
sendAuthDataToBackground()

// Monitor localStorage changes for auth updates
const originalSetItem = localStorage.setItem
const originalRemoveItem = localStorage.removeItem
const originalClear = localStorage.clear

// Override setItem to detect auth changes
localStorage.setItem = function(key: string, value: string) {
  originalSetItem.apply(this, [key, value])
  
  if (['accessToken', 'refreshToken', 'user', 'company', 'roles', 'tokenExpiry'].includes(key)) {
    console.log(`🔄 localStorage updated: ${key}`)
    setTimeout(sendAuthDataToBackground, 100)
  }
}

// Override removeItem to detect auth removal
localStorage.removeItem = function(key: string) {
  originalRemoveItem.apply(this, [key])
  
  if (['accessToken', 'refreshToken', 'user', 'company', 'roles', 'tokenExpiry'].includes(key)) {
    console.log(`🗑️ localStorage removed: ${key}`)
    setTimeout(sendAuthDataToBackground, 100)
  }
}

// Override clear to detect full localStorage clear
localStorage.clear = function() {
  originalClear.apply(this)
  console.log('🧹 localStorage cleared')
  setTimeout(sendAuthDataToBackground, 100)
}

// Also monitor for storage events (changes from other tabs)
window.addEventListener('storage', (event) => {
  if (event.storageArea === localStorage && 
      ['accessToken', 'refreshToken', 'user', 'company', 'roles', 'tokenExpiry'].includes(event.key || '')) {
    console.log(`🔄 Storage event detected: ${event.key}`)
    setTimeout(sendAuthDataToBackground, 100)
  }
})

// Check for auth data periodically (fallback)
setInterval(sendAuthDataToBackground, 30000) // Every 30 seconds

export {}