// contents/dashboard.ts
import { sendToBackground } from "@plasmohq/messaging"
import type { PlasmoCSConfig } from "plasmo"

// Configure which sites this content script runs on
export const config: PlasmoCSConfig = {
  matches: ["http://localhost:3000/*", "https://yourdashboard.com/*"],
  run_at: "document_end"
}

console.log("🔍 Echooo Dashboard content script loaded")

// Your existing content script code...
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

// Send auth data immediately
sendAuthDataToExtension()

// Monitor localStorage changes
const originalSetItem = localStorage.setItem
localStorage.setItem = function(key: string, value: string) {
  originalSetItem.apply(this, [key, value])
  
  if (['accessToken', 'refreshToken', 'user', 'company', 'roles'].includes(key)) {
    console.log(`🔄 localStorage updated: ${key}`)
    setTimeout(sendAuthDataToExtension, 100)
  }
}

export {}