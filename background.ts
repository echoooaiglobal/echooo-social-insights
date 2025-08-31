// background.ts
// Background script using PLASMO MESSAGING SYSTEM
import { Storage } from "@plasmohq/storage"
import type { PlasmoMessaging } from "@plasmohq/messaging"

const storage = new Storage()

console.log("🚀 Echooo Extension background script loaded (Plasmo)")

// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("📦 Extension installed:", details.reason)
  
  if (details.reason === "install") {
    console.log("🎉 Welcome to Echooo Extension!")
  }
})

// ============================================
// PLASMO MESSAGE HANDLERS
// ============================================

// Handle caching dashboard auth data
export const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  console.log("📨 Plasmo message received:", req.name)
  
  if (req.name === "cache-dashboard-auth") {
    try {
      const authData = req.body
      
      console.log("💾 Caching dashboard auth data:", {
        hasAccessToken: !!authData?.accessToken,
        hasUser: !!authData?.user,
        hasCompany: !!authData?.company
      })
      
      // Store the raw auth data from dashboard localStorage
      await storage.set('dashboardAuth', authData)
      
      // Also create formatted user data for easier access
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
          console.log('✅ Auth data cached successfully:', formattedUserData)
          
          res.send({ success: true, userData: formattedUserData })
        } catch (parseError) {
          console.error('❌ Error parsing user data:', parseError)
          res.send({ success: true, warning: 'Auth cached but user data parse failed' })
        }
      } else {
        res.send({ success: true })
      }
      
    } catch (error) {
      console.error("❌ Error caching dashboard auth:", error)
      res.send({ success: false, error: (error as Error).message })
    }
  }
  else if (req.name === "clear-dashboard-auth") {
    try {
      console.log("🧹 Clearing dashboard auth data")
      await storage.remove('dashboardAuth')
      await storage.remove('userData')
      res.send({ success: true })
    } catch (error) {
      console.error("❌ Error clearing dashboard auth:", error)
      res.send({ success: false, error: (error as Error).message })
    }
  }
  else {
    res.send({ success: false, error: "Unknown message name" })
  }
}

// Handle tab updates to detect dashboard visits
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const dashboardUrl = process.env.PLASMO_PUBLIC_DASHBOARD_URL || 'http://localhost:3000'
    
    if (tab.url.startsWith(dashboardUrl)) {
      console.log("🔍 Dashboard page detected, content script should be active")
    }
  }
})

export default handler