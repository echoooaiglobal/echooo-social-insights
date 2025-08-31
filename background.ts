// background.ts
// Simplified background script - no infinite loops
import { Storage } from "@plasmohq/storage"
import type { PlasmoMessaging } from "@plasmohq/messaging"

const storage = new Storage()

console.log("🚀 Echooo Extension background script loaded (Simplified)")

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Extension installed:", details.reason)
  
  if (details.reason === "install") {
    console.log("🎉 Welcome to Echooo Extension!")
  }
})

// ============================================
// SIMPLE AUTH CHECKING FUNCTION
// ============================================

async function checkDashboardAuth() {
  try {
    console.log("🔍 Checking for existing dashboard authentication...")
    
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    
    // Find existing dashboard tabs
    const tabs = await chrome.tabs.query({ url: `${dashboardUrl}/*` })
    
    if (tabs.length > 0) {
      console.log(`📍 Found ${tabs.length} dashboard tab(s)`)
      
      // Inject script into the first dashboard tab found
      const tab = tabs[0]
      if (tab.id) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Extract auth data from dashboard localStorage
              try {
                const accessToken = localStorage.getItem('accessToken')
                const refreshToken = localStorage.getItem('refreshToken') 
                const tokenExpiry = localStorage.getItem('tokenExpiry')
                const user = localStorage.getItem('user')
                const company = localStorage.getItem('company')
                const roles = localStorage.getItem('roles')

                if (accessToken && user) {
                  // Send auth data to background script
                  chrome.runtime.sendMessage({
                    type: 'DASHBOARD_AUTH_FOUND',
                    data: {
                      accessToken,
                      refreshToken,
                      tokenExpiry, 
                      user,
                      company,
                      roles
                    }
                  })
                  console.log('✅ Dashboard auth data sent to background')
                } else {
                  chrome.runtime.sendMessage({
                    type: 'DASHBOARD_AUTH_NOT_FOUND'
                  })
                  console.log('❌ No dashboard auth data found')
                }
              } catch (error) {
                console.error('❌ Error extracting dashboard auth:', error)
                chrome.runtime.sendMessage({
                  type: 'DASHBOARD_AUTH_ERROR',
                  error: error.message
                })
              }
            }
          })
          console.log(`✅ Auth check script injected into tab ${tab.id}`)
        } catch (error) {
          console.log(`⚠️ Failed to inject script into tab ${tab.id}:`, error)
        }
      }
    } else {
      console.log("📭 No dashboard tabs found")
    }
  } catch (error) {
    console.error("❌ Error checking dashboard auth:", error)
  }
}

// ============================================
// CHROME MESSAGE HANDLERS
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Chrome message received:", message.type)
  
  switch (message.type) {
    case 'TRIGGER_AUTH_CHECK':
      console.log('📡 Manual auth check triggered')
      checkDashboardAuth()
      sendResponse({ success: true })
      break
      
    case 'DASHBOARD_AUTH_FOUND':
      handleDashboardAuthFound(message.data, sendResponse)
      return true
      
    case 'DASHBOARD_AUTH_NOT_FOUND':
      handleDashboardAuthNotFound(sendResponse)
      return true
      
    case 'DASHBOARD_AUTH_ERROR':
      console.error('❌ Dashboard auth error:', message.error)
      sendResponse({ success: false, error: message.error })
      break
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' })
  }
})

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
        
        sendResponse({ success: true, userData: formattedUserData })
      } catch (parseError) {
        console.error('❌ Error parsing dashboard user data:', parseError)
        sendResponse({ success: true, warning: 'Auth cached but parse failed' })
      }
    } else {
      sendResponse({ success: true })
    }
  } catch (error) {
    console.error("❌ Error caching dashboard auth:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

async function handleDashboardAuthNotFound(sendResponse: (response: any) => void) {
  try {
    console.log("🧹 No dashboard auth found, clearing cache")
    await storage.remove('dashboardAuth')
    await storage.remove('userData')
    sendResponse({ success: true })
  } catch (error) {
    console.error("❌ Error clearing auth cache:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// ============================================
// PLASMO MESSAGE HANDLERS (for content script)
// ============================================

export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("📨 Plasmo message received:", req.name)
  
  if (req.name === "cache-dashboard-auth") {
    // Handle regular content script messages
    await handleDashboardAuthFound(req.body, (response) => {
      res.send(response)
    })
  } else if (req.name === "clear-dashboard-auth") {
    await handleDashboardAuthNotFound((response) => {
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
      console.log("🔍 Dashboard page detected, checking auth in 2 seconds...")
      // Wait a bit for page to load, then check auth
      setTimeout(checkDashboardAuth, 2000)
    }
  }
})

export default handler