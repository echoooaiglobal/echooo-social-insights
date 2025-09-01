// background.ts
// Enhanced background script with proactive auth checking
import { Storage } from "@plasmohq/storage"
import type { PlasmoMessaging } from "@plasmohq/messaging"

const storage = new Storage()

console.log("🚀 Echooo Extension background script loaded (Enhanced)")

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Extension installed:", details.reason)
  
  if (details.reason === "install") {
    console.log("🎉 Welcome to Echooo Extension!")
    // Check auth immediately after installation
    setTimeout(checkDashboardAuth, 2000)
  }
})

// Handle extension startup (when browser starts)
chrome.runtime.onStartup.addListener(async () => {
  console.log("🔄 Extension starting up...")
  // Check auth on browser startup
  setTimeout(checkDashboardAuth, 3000)
})

// ============================================
// PROACTIVE AUTH CHECKING
// ============================================

/**
 * Inject content script into dashboard tab to check authentication
 */
async function checkDashboardAuth() {
  try {
    console.log("🔍 Checking for existing dashboard authentication...")
    
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    
    // Find dashboard tabs
    const tabs = await chrome.tabs.query({ url: `${dashboardUrl}/*` })
    
    if (tabs.length > 0) {
      console.log(`📍 Found ${tabs.length} dashboard tab(s), injecting content script...`)
      
      // Inject content script into existing dashboard tabs
      for (const tab of tabs) {
        if (tab.id) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: extractAndSendAuthData
            })
            console.log(`✅ Auth check injected into tab ${tab.id}`)
          } catch (error) {
            console.log(`⚠️ Failed to inject into tab ${tab.id}:`, error)
          }
        }
      }
    } else {
      console.log("📭 No dashboard tabs found, checking if user needs to login...")
      
      // Create a hidden iframe to check auth (alternative approach)
      await checkAuthViaIframe()
    }
  } catch (error) {
    console.error("❌ Error checking dashboard auth:", error)
  }
}

/**
 * Function that gets injected into dashboard tabs to extract auth data
 */
function extractAndSendAuthData() {
  try {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken') 
    const tokenExpiry = localStorage.getItem('tokenExpiry')
    const user = localStorage.getItem('user')
    const company = localStorage.getItem('company')
    const roles = localStorage.getItem('roles')

    console.log('📊 Injected script found localStorage data:', {
      hasAccessToken: !!accessToken,
      hasUser: !!user,
      hasCompany: !!company
    })

    if (accessToken && user) {
      // Send auth data to background script
      chrome.runtime.sendMessage({
        type: 'INJECTED_AUTH_DATA',
        data: {
          accessToken,
          refreshToken,
          tokenExpiry, 
          user,
          company,
          roles
        }
      })
      console.log('✅ Auth data sent to background from injected script')
    } else {
      // Send clear signal
      chrome.runtime.sendMessage({
        type: 'INJECTED_AUTH_CLEAR'
      })
      console.log('🧹 Clear signal sent from injected script')
    }
  } catch (error) {
    console.error('❌ Injected script error:', error)
  }
}

/**
 * Alternative: Check auth using hidden iframe (for when no dashboard tabs exist)
 */
async function checkAuthViaIframe() {
  try {
    console.log("🖼️ Creating hidden iframe to check dashboard auth...")
    
    // Create a new tab in background to check auth
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    
    const tab = await chrome.tabs.create({
      url: dashboardUrl,
      active: false  // Don't focus the tab
    })
    
    if (tab.id) {
      // Wait for tab to load, then inject script
      setTimeout(async () => {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id! },
            func: extractAndSendAuthData
          })
          
          // Close the background tab after 2 seconds
          setTimeout(() => {
            chrome.tabs.remove(tab.id!)
          }, 2000)
        } catch (error) {
          console.error("❌ Error with background tab:", error)
          chrome.tabs.remove(tab.id!)
        }
      }, 3000)
    }
  } catch (error) {
    console.error("❌ Error creating background auth check:", error)
  }
}

// ============================================
// CHROME RUNTIME MESSAGE HANDLERS (for injected scripts)
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INJECTED_AUTH_DATA') {
    handleInjectedAuthData(message.data, sendResponse)
    return true
  } else if (message.type === 'INJECTED_AUTH_CLEAR') {
    handleInjectedAuthClear(sendResponse)
    return true
  } else if (message.type === 'TRIGGER_AUTH_CHECK') {
    console.log('📡 Manual auth check triggered from popup')
    checkDashboardAuth()
    sendResponse({ success: true })
    return true
  }
})

async function handleInjectedAuthData(authData: any, sendResponse: (response: any) => void) {
  try {
    console.log("💾 Caching injected auth data:", {
      hasAccessToken: !!authData?.accessToken,
      hasUser: !!authData?.user,
      hasCompany: !!authData?.company
    })
    
    // Store the raw auth data
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
        console.log('✅ Injected auth data cached successfully:', formattedUserData)
        
        sendResponse({ success: true })
      } catch (parseError) {
        console.error('❌ Error parsing injected user data:', parseError)
        sendResponse({ success: false, error: 'Parse failed' })
      }
    } else {
      sendResponse({ success: true })
    }
  } catch (error) {
    console.error("❌ Error caching injected auth data:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

async function handleInjectedAuthClear(sendResponse: (response: any) => void) {
  try {
    console.log("🧹 Clearing auth data (from injected script)")
    await storage.remove('dashboardAuth')
    await storage.remove('userData')
    sendResponse({ success: true })
  } catch (error) {
    console.error("❌ Error clearing injected auth data:", error)
    sendResponse({ success: false, error: (error as Error).message })
  }
}

// ============================================
// PLASMO MESSAGE HANDLERS (for regular content script)
// ============================================

export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("📨 Plasmo message received:", req.name)
  
  if (req.name === "cache-dashboard-auth") {
    try {
      const authData = req.body
      
      console.log("💾 Caching dashboard auth data (Plasmo):", {
        hasAccessToken: !!authData?.accessToken,
        hasUser: !!authData?.user,
        hasCompany: !!authData?.company
      })
      
      await storage.set('dashboardAuth', authData)
      
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
          console.log('✅ Auth data cached successfully (Plasmo):', formattedUserData)
          
          res.send({ success: true, userData: formattedUserData })
        } catch (parseError) {
          console.error('❌ Error parsing user data (Plasmo):', parseError)
          res.send({ success: true, warning: 'Auth cached but user data parse failed' })
        }
      } else {
        res.send({ success: true })
      }
      
    } catch (error) {
      console.error("❌ Error caching dashboard auth (Plasmo):", error)
      res.send({ success: false, error: (error as Error).message })
    }
  }
  else if (req.name === "clear-dashboard-auth") {
    try {
      console.log("🧹 Clearing dashboard auth data (Plasmo)")
      await storage.remove('dashboardAuth')
      await storage.remove('userData')
      res.send({ success: true })
    } catch (error) {
      console.error("❌ Error clearing dashboard auth (Plasmo):", error)
      res.send({ success: false, error: (error as Error).message })
    }
  }
  else {
    res.send({ success: false, error: "Unknown message name" })
  }
}

// ============================================
// PERIODIC AUTH CHECKING
// ============================================

// Check auth every 5 minutes
setInterval(checkDashboardAuth, 5 * 60 * 1000)

// Handle tab updates to detect dashboard visits
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    
    if (tab.url.startsWith(dashboardUrl)) {
      console.log("🔍 Dashboard page detected, checking auth...")
      // Check auth when user visits dashboard
      setTimeout(checkDashboardAuth, 1000)
    }
  }
})

export default handler