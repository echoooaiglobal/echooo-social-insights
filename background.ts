// background.ts
// Updated background script with Instagram profile handling via Plasmo messaging
import { Storage } from "@plasmohq/storage"
import type { PlasmoMessaging } from "@plasmohq/messaging"
import type { InstagramProfile } from "./src/types/instagram"

const storage = new Storage()

console.log("🚀 Echooo Extension background script loaded")

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Extension installed:", details.reason)
  
  if (details.reason === "install") {
    console.log("🎉 Welcome to Echooo Extension!")
  }
})

// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
  console.log("🔄 Extension starting up...")
})

// ============================================
// CHROME MESSAGE HANDLERS (for legacy dashboard injected scripts)
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Background received message:", message.type)
  
  switch (message.type) {
    case 'DASHBOARD_AUTH_FOUND':
      handleDashboardAuthFound(message.data, sendResponse)
      return true
      
    case 'DASHBOARD_AUTH_NOT_FOUND':
      handleDashboardAuthNotFound(sendResponse)
      return true
      
    case 'INSTAGRAM_PROFILE_UPDATE':
      handleInstagramProfileUpdate(message.data, sendResponse)
      return true
      
    default:
      console.warn("⚠️ Unknown message type:", message.type)
      sendResponse({ success: false, error: "Unknown message type" })
  }
})

// Handle dashboard auth found
async function handleDashboardAuthFound(authData: any, sendResponse: (response: any) => void) {
  try {
    console.log("💾 Caching dashboard auth data:", {
      hasAccessToken: !!authData?.accessToken,
      hasUser: !!authData?.user,
      hasCompany: !!authData?.company
    })
    
    // Store raw auth data
    await storage.set('dashboardAuth', authData)
    
    // Create formatted user data
    if (authData.user) {
      try {
        const userData = JSON.parse(authData.user)
        const companyData = authData.company ? JSON.parse(authData.company) : null
        
        const formattedUserData = {
          id: userData.id,
          fullName: userData.full_name || 
                    (userData.first_name && userData.last_name ? 
                     `${userData.first_name} ${userData.last_name}` : 
                     userData.email || 'User'),
          email: userData.email,
          companyName: companyData?.name || companyData?.domain || 'Company',
          isAuthenticated: true,
          lastUpdated: Date.now()
        }
        
        await storage.set('userData', formattedUserData)
        console.log('✅ Dashboard auth cached successfully:', formattedUserData)
        
        sendResponse({ success: true })
      } catch (parseError) {
        console.error('❌ Error parsing dashboard user data:', parseError)
        sendResponse({ success: false, error: 'Parse failed' })
      }
    } else {
      sendResponse({ success: true })
    }
  } catch (error) {
    console.error("❌ Error caching dashboard auth:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// Handle dashboard auth not found
async function handleDashboardAuthNotFound(sendResponse: (response: any) => void) {
  try {
    console.log("🧹 Clearing dashboard auth cache")
    await storage.remove('dashboardAuth')
    await storage.remove('userData')
    sendResponse({ success: true })
  } catch (error) {
    console.error("❌ Error clearing auth cache:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// Handle Instagram profile updates (legacy chrome.runtime.sendMessage)
async function handleInstagramProfileUpdate(profile: InstagramProfile | null, sendResponse: (response: any) => void) {
  try {
    if (profile) {
      console.log("📊 Instagram profile detected:", {
        username: profile.username,
        displayName: profile.displayName,
        followers: profile.followers,
        isVerified: profile.isVerified,
        isPrivate: profile.isPrivate
      })
      
      // Store current Instagram profile
      await storage.set('currentInstagramProfile', profile)
      
      sendResponse({ success: true, profile })
    } else {
      console.log("❌ Instagram profile cleared")
      
      // Clear stored profile
      await storage.remove('currentInstagramProfile')
      
      sendResponse({ success: true, profile: null })
    }
  } catch (error) {
    console.error("❌ Error handling Instagram profile update:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// ============================================
// PLASMO MESSAGE HANDLERS (for content scripts)
// ============================================

export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("📨 Plasmo message received:", req.name)
  
  if (req.name === "cache-dashboard-auth") {
    // Handle dashboard content script messages
    await handleDashboardAuthFound(req.body, (response) => {
      res.send(response)
    })
  } else if (req.name === "clear-dashboard-auth") {
    await handleDashboardAuthNotFound((response) => {
      res.send(response)
    })
  } else if (req.name === "instagram-profile-update") {
    // Handle Instagram content script messages
    await handleInstagramProfileUpdate(req.body, (response) => {
      res.send(response)
    })
  } else {
    res.send({ success: false, error: "Unknown message name" })
  }
}

// ============================================
// TAB MONITORING
// ============================================

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    
    if (tab.url.startsWith(dashboardUrl)) {
      console.log("🔍 Dashboard page detected")
    } else if (tab.url.includes('instagram.com')) {
      console.log("📱 Instagram page detected")
      // Instagram content script will handle profile detection
    }
  }
})

export default handler