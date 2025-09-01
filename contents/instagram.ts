// contents/instagram.ts - Debug version
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.instagram.com/*",
    "https://instagram.com/*"
  ],
  run_at: "document_end"
}

console.log("🔍 [DEBUG] Instagram content script loaded on:", window.location.href)

interface InstagramProfile {
  username: string
  displayName: string
  bio: string
  profilePicture: string
  followers: string
  following: string
  posts: string
  isVerified: boolean
  isPrivate: boolean
  url: string
  lastUpdated: number
}

let currentProfile: InstagramProfile | null = null
let profileCheckInterval: NodeJS.Timeout | null = null

// Start monitoring immediately
setTimeout(() => {
  console.log("🔍 [DEBUG] Starting profile monitoring after 2 seconds...")
  startProfileMonitoring()
}, 2000)

function startProfileMonitoring() {
  console.log("🔄 [DEBUG] Profile monitoring started")
  
  // Check immediately
  checkForProfile()
  
  // Set up periodic checking
  if (profileCheckInterval) {
    clearInterval(profileCheckInterval)
  }
  
  profileCheckInterval = setInterval(() => {
    console.log("⏰ [DEBUG] Periodic profile check...")
    checkForProfile()
  }, 3000) // Check every 3 seconds
  
  // Monitor URL changes
  let lastUrl = location.href
  new MutationObserver(() => {
    const url = location.href
    if (url !== lastUrl) {
      lastUrl = url
      console.log("🌐 [DEBUG] URL changed to:", url)
      setTimeout(checkForProfile, 1500)
    }
  }).observe(document, { subtree: true, childList: true })
}

function checkForProfile() {
  console.log("🔍 [DEBUG] Checking for profile...")
  console.log("📍 [DEBUG] Current URL:", window.location.href)
  
  try {
    // Check if we're on a profile page
    const isProfile = isProfilePage()
    console.log("✅ [DEBUG] Is profile page:", isProfile)
    
    if (!isProfile) {
      if (currentProfile) {
        console.log("❌ [DEBUG] Left profile page")
        currentProfile = null
        sendProfileToExtension(null)
      }
      return
    }

    // Extract profile data with detailed logging
    const profile = extractProfileData()
    console.log("📊 [DEBUG] Extracted profile:", profile)
    
    if (profile && profile.username) {
      // Check if profile changed
      if (!currentProfile || currentProfile.username !== profile.username) {
        console.log("✅ [DEBUG] New profile detected:", profile.username)
        currentProfile = profile
        sendProfileToExtension(profile)
      } else {
        console.log("📝 [DEBUG] Same profile, no update needed")
      }
    } else {
      console.log("❌ [DEBUG] No valid profile extracted")
    }
  } catch (error) {
    console.error("❌ [DEBUG] Error in checkForProfile:", error)
  }
}

function isProfilePage(): boolean {
  const url = window.location.href
  console.log("🔍 [DEBUG] Checking URL:", url)
  
  // Check URL pattern
  const profilePattern = /^https:\/\/(www\.)?instagram\.com\/([^\/\?]+)\/?(\?.*)?$/
  const matches = profilePattern.test(url)
  console.log("🔍 [DEBUG] URL pattern matches:", matches)
  
  if (!matches) {
    return false
  }
  
  // Get username from URL
  const urlMatch = window.location.pathname.match(/^\/([^\/\?]+)/)
  const username = urlMatch ? urlMatch[1] : ''
  console.log("🔍 [DEBUG] Username from URL:", username)
  
  // Check for excluded paths
  const excludedPaths = ['explore', 'reels', 'accounts', 'direct', 'p', 'stories', 'tv']
  const isExcluded = excludedPaths.includes(username)
  console.log("🔍 [DEBUG] Is excluded path:", isExcluded)
  
  if (isExcluded) {
    return false
  }
  
  // Look for profile elements with detailed logging
  console.log("🔍 [DEBUG] Looking for profile elements...")
  
  const selectors = [
    'header section',
    '[data-testid="user-avatar"]',
    'img[data-testid="user-avatar"]',
    'main header',
    'article header'
  ]
  
  for (const selector of selectors) {
    const element = document.querySelector(selector)
    console.log(`🔍 [DEBUG] Selector "${selector}":`, !!element)
    if (element) {
      return true
    }
  }
  
  console.log("❌ [DEBUG] No profile elements found")
  return false
}

function extractProfileData(): InstagramProfile | null {
  console.log("🔍 [DEBUG] Starting profile data extraction...")
  
  try {
    // Get username from URL
    const urlMatch = window.location.pathname.match(/^\/([^\/\?]+)/)
    const username = urlMatch ? urlMatch[1] : ''
    console.log("👤 [DEBUG] Username:", username)
    
    if (!username) {
      console.log("❌ [DEBUG] No username found")
      return null
    }

    // Extract display name with multiple attempts
    const displayName = extractDisplayName()
    console.log("📝 [DEBUG] Display name:", displayName)
    
    // Extract bio
    const bio = extractBio()
    console.log("📄 [DEBUG] Bio:", bio)
    
    // Extract profile picture
    const profilePicture = extractProfilePicture()
    console.log("🖼️ [DEBUG] Profile picture URL:", profilePicture ? "Found" : "Not found")
    
    // Extract stats
    const stats = extractStats()
    console.log("📊 [DEBUG] Stats:", stats)
    
    // Check verification and privacy
    const isVerified = checkVerification()
    const isPrivate = checkPrivacy()
    console.log("✓ [DEBUG] Verified:", isVerified, "Private:", isPrivate)
    
    const profile: InstagramProfile = {
      username,
      displayName: displayName || username,
      bio: bio || '',
      profilePicture: profilePicture || '',
      followers: stats.followers || '0',
      following: stats.following || '0',
      posts: stats.posts || '0',
      isVerified,
      isPrivate,
      url: window.location.href,
      lastUpdated: Date.now()
    }
    
    console.log("✅ [DEBUG] Final profile object:", profile)
    return profile
    
  } catch (error) {
    console.error("❌ [DEBUG] Error extracting profile data:", error)
    return null
  }
}

function extractDisplayName(): string {
  console.log("🔍 [DEBUG] Extracting display name...")
  
  const selectors = [
    'h2',
    'h1',
    'span[dir="auto"]',
    '[data-testid="user-title"]',
    'header h1',
    'header h2',
    'main header h1',
    'main header h2'
  ]
  
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector)
    console.log(`🔍 [DEBUG] Selector "${selector}" found ${elements.length} elements`)
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]
      const text = element.textContent?.trim()
      console.log(`🔍 [DEBUG] Element ${i} text:`, text)
      
      if (text && text.length > 0 && text.length < 100 && !text.includes('@') && !text.includes('posts')) {
        console.log("✅ [DEBUG] Found display name:", text)
        return text
      }
    }
  }
  
  console.log("❌ [DEBUG] No display name found")
  return ''
}

function extractBio(): string {
  console.log("🔍 [DEBUG] Extracting bio...")
  // Simplified for now
  return ''
}

function extractProfilePicture(): string {
  console.log("🔍 [DEBUG] Extracting profile picture...")
  
  const selectors = [
    'img[alt*="profile picture"]',
    'header img',
    'main header img',
    'img[style*="border-radius"]'
  ]
  
  for (const selector of selectors) {
    const img = document.querySelector(selector) as HTMLImageElement
    if (img?.src) {
      console.log(`🔍 [DEBUG] Found image with selector "${selector}":`, img.src)
      if (!img.src.includes('static') && img.src.includes('instagram')) {
        return img.src
      }
    }
  }
  
  console.log("❌ [DEBUG] No profile picture found")
  return ''
}

function extractStats(): { followers: string; following: string; posts: string } {
  console.log("🔍 [DEBUG] Extracting stats...")
  
  const stats = { followers: '0', following: '0', posts: '0' }
  
  // Look for numbers in the page text
  const allText = document.body.textContent || ''
  console.log("🔍 [DEBUG] Page text length:", allText.length)
  
  // Simple pattern matching for now
  const numberMatches = allText.match(/(\d+(?:,\d+)*(?:\.\d+)?[kmb]?)/gi) || []
  console.log("🔍 [DEBUG] Number matches found:", numberMatches.length)
  
  if (numberMatches.length >= 3) {
    stats.posts = numberMatches[0] || '0'
    stats.followers = numberMatches[1] || '0'
    stats.following = numberMatches[2] || '0'
  }
  
  console.log("📊 [DEBUG] Extracted stats:", stats)
  return stats
}

function checkVerification(): boolean {
  const hasVerificationBadge = document.querySelector('svg[aria-label*="Verified"]') !== null
  console.log("✓ [DEBUG] Verification check:", hasVerificationBadge)
  return hasVerificationBadge
}

function checkPrivacy(): boolean {
  const pageText = document.body.textContent || ''
  const isPrivate = pageText.toLowerCase().includes('this account is private')
  console.log("🔒 [DEBUG] Privacy check:", isPrivate)
  return isPrivate
}

function sendProfileToExtension(profile: InstagramProfile | null) {
  console.log("📤 [DEBUG] Sending profile to extension:", profile?.username || 'null')
  
  try {
    chrome.runtime.sendMessage({
      type: 'INSTAGRAM_PROFILE_UPDATE',
      data: profile
    }).then(response => {
      console.log("✅ [DEBUG] Extension response:", response)
    }).catch(error => {
      console.log("❌ [DEBUG] Extension error:", error)
    })
  } catch (error) {
    console.log("❌ [DEBUG] Failed to send message:", error)
  }
}

// Manual trigger for testing
(window as any).debugInstagramExtraction = () => {
  console.log("🔍 [DEBUG] Manual extraction triggered")
  checkForProfile()
}

console.log("✅ [DEBUG] Instagram content script setup complete")
console.log("💡 [DEBUG] You can run 'debugInstagramExtraction()' in console to manually trigger")

export {}