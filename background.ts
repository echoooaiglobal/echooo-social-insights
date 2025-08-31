// background.ts (place this in root directory)
import { Storage } from "@plasmohq/storage"

const storage = new Storage()

console.log("🚀 Echooo Extension background script loaded")

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Extension installed:", details.reason)
  
  if (details.reason === "install") {
    console.log("🎉 Welcome to Echooo Extension!")
  }
})

// Handle extension startup (browser restart)
chrome.runtime.onStartup.addListener(async () => {
  console.log("🔄 Extension starting up...")
})

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Message received:", message.type || message)
  
  switch (message.type) {
    case "CACHE_DASHBOARD_AUTH":
      handleCacheDashboardAuth(sendResponse)
      return true
      
    case "CHECK_AUTH":
      handleCheckAuth(sendResponse)
      return true
      
    case "SYNC_DATA":
      handleSyncData(sendResponse)
      return true
      
    case "OPEN_LOGIN":
      handleOpenLogin(sendResponse)
      return true
      
    default:
      console.warn("⚠️ Unknown message type:", message.type)
      sendResponse({ success: false, error: "Unknown message type" })
  }
})

// Handle caching dashboard auth data (from content script)
async function handleCacheDashboardAuth(sendResponse: (response: any) => void) {
  try {
    // The actual auth data will come from the content script via Plasmo messaging
    // This is just a placeholder - the real implementation is in the message handler below
    sendResponse({ success: true })
  } catch (error) {
    console.error("❌ Error caching dashboard auth:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// Handle authentication check
async function handleCheckAuth(sendResponse: (response: any) => void) {
  try {
    // Check if we have cached dashboard auth data
    const dashboardAuth = await storage.get('dashboardAuth')
    
    if (!dashboardAuth || !dashboardAuth.accessToken) {
      sendResponse({ success: true, isAuthenticated: false })
      return
    }

    // Check if token is still valid
    const isTokenValid = dashboardAuth.tokenExpiry && Date.now() < parseInt(dashboardAuth.tokenExpiry)
    
    sendResponse({ success: true, isAuthenticated: isTokenValid })
  } catch (error) {
    console.error("❌ Error checking auth:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// Handle data sync
async function handleSyncData(sendResponse: (response: any) => void) {
  try {
    const dashboardAuth = await storage.get('dashboardAuth')
    
    if (!dashboardAuth) {
      throw new Error('No authentication data available')
    }

    // Parse user data
    const userData = dashboardAuth.user ? JSON.parse(dashboardAuth.user) : null
    const companyData = dashboardAuth.company ? JSON.parse(dashboardAuth.company) : null

    if (userData) {
      // Create user data in extension format
      const extensionUserData = {
        id: userData.id,
        fullName: userData.full_name || 'User',
        email: userData.email,
        companyName: companyData?.name || 'Company',
        isAuthenticated: true,
        lastUpdated: Date.now()
      }

      // Save to extension storage
      await storage.set('userData', extensionUserData)
      
      console.log('✅ User data synced:', extensionUserData)
      sendResponse({ success: true, userData: extensionUserData })
    } else {
      throw new Error('No user data available')
    }
  } catch (error) {
    console.error("❌ Error syncing data:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// Handle opening login page
async function handleOpenLogin(sendResponse: (response: any) => void) {
  try {
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    const loginUrl = `${dashboardUrl}/login`
    
    await chrome.tabs.create({ url: loginUrl })
    sendResponse({ success: true })
  } catch (error) {
    console.error("❌ Error opening login:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// Plasmo messaging system for content script communication
import { type PlasmoMessaging } from "@plasmohq/messaging"

// Handle auth data from dashboard content script
const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("📨 Content script message received:", req.name)
  
  if (req.name === "cache-dashboard-auth") {
    try {
      const authData = req.body
      
      console.log("💾 Caching dashboard auth data:", {
        hasAccessToken: !!authData.accessToken,
        hasUser: !!authData.user,
        hasCompany: !!authData.company
      })
      
      // Store the auth data in extension storage
      await storage.set('dashboardAuth', authData)
      
      // Also sync user data immediately
      if (authData.user) {
        const userData = JSON.parse(authData.user)
        const companyData = authData.company ? JSON.parse(authData.company) : null
        
        const extensionUserData = {
          id: userData.id,
          fullName: userData.full_name || userData.first_name + ' ' + userData.last_name || 'User',
          email: userData.email,
          companyName: companyData?.name || 'Company',
          isAuthenticated: true,
          lastUpdated: Date.now()
        }
        
        await storage.set('userData', extensionUserData)
        console.log('✅ User data synced from dashboard:', extensionUserData)
      }
      
      res.send({ success: true })
    } catch (error) {
      console.error("❌ Error processing dashboard auth:", error)
      res.send({ success: false, error: (error as Error).message })
    }
  } else {
    res.send({ success: false, error: "Unknown message" })
  }
}

export default handler

// Handle tab updates to inject content script on dashboard
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    
    if (tab.url.startsWith(dashboardUrl)) {
      console.log("🔍 Dashboard page detected, content script should be active")
    }
  }
})