// contents/instagram.ts
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: [
    "https://www.instagram.com/*",
    "https://instagram.com/*"
  ],
  run_at: "document_end"
}

console.log("🚀 [DEBUG] Instagram content script loaded!")
console.log("📍 [DEBUG] Current URL:", window.location.href)

interface InstagramProfile {
  username: string
  displayName: string
  bio: string
  location?: string
  profilePicture: string
  followers: string
  following: string
  posts: string
  isVerified: boolean
  isPrivate: boolean
  url: string
  lastUpdated: number
}

function extractSimpleProfile(): InstagramProfile | null {
  console.log("🔍 [DEBUG] Extracting Instagram profile...")
  
  // Get username from URL
  const urlMatch = window.location.pathname.match(/^\/([^\/\?]+)/)
  const username = urlMatch ? urlMatch[1] : ''
  
  console.log("👤 [DEBUG] Username from URL:", username)
  
  if (!username || ['explore', 'reels', 'accounts', 'direct', 'p', 'stories', 'tv'].includes(username)) {
    console.log("❌ [DEBUG] Not a profile page")
    return null
  }
  
  // Extract display name from h2 or h1 elements
  let displayName = username
  const nameElements = document.querySelectorAll('h1, h2')
  for (const element of nameElements) {
    const text = element.textContent?.trim()
    // Look for text that looks like a name (not stats, not navigation)
    if (text && text !== username && text.length > 2 && text.length < 50 && 
        !text.includes('followers') && !text.includes('following') && 
        !text.includes('posts') && !text.includes('M') && !text.includes('K') &&
        !text.includes('Tagged') && !text.includes('Reels')) {
      displayName = text
      console.log("📝 [DEBUG] Found display name:", displayName)
      break
    }
  }

  // Extract bio - look more specifically
  let bio = ''
  const bioSelectors = [
    'div[data-testid="user-bio"]',
    'header section div:last-child',
    'header div[style*="word"]'
  ]
  for (const selector of bioSelectors) {
    const bioElement = document.querySelector(selector)
    if (bioElement) {
      const text = bioElement.textContent?.trim()
      // Bio should be meaningful text, not navigation elements
      if (text && text.length > 5 && text.length < 300 && 
          !text.includes('posts') && !text.includes('followers') && 
          !text.includes('Tagged') && !text.includes('Reels') &&
          !text.match(/^\d+$/)) {
        bio = text
        console.log("📄 [DEBUG] Found bio:", bio.substring(0, 100))
        break
      }
    }
  }

  // Extract location from bio if available
  let location = ''
  const bioText = bio || ''
  // Look for common location indicators
  const locationPatterns = [
    /📍(.+)/,
    /🌍(.+)/,
    /📌(.+)/,
    /(Pakistan|India|USA|UK|Canada|Dubai|Karachi|Lahore|Mumbai|Delhi)/i
  ]

  for (const pattern of locationPatterns) {
    const match = bioText.match(pattern)
    if (match) {
      location = match[1] ? match[1].trim() : match[0]
      break
    }
  }

  console.log("🌍 [DEBUG] Extracted location:", location)
  
  // Extract stats using more specific selectors
  // Extract stats using more aggressive selectors
  let posts = '0', followers = '0', following = '0'
  
  // Method 1: Look for text patterns in the entire page
  const allText = document.body.textContent || ''
  console.log("📊 [DEBUG] Looking for stats in page text...")
  
  // Look for "X posts", "X followers", "X following" patterns
  const postsMatch = allText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*posts/i)
  const followersMatch = allText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*followers/i)
  const followingMatch = allText.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s*following/i)
  
  console.log("📊 [DEBUG] RegEx matches:", { postsMatch, followersMatch, followingMatch })
  
  if (postsMatch) posts = postsMatch[1]
  if (followersMatch) followers = followersMatch[1] 
  if (followingMatch) following = followingMatch[1]
  
  // Method 2: If regex fails, look for numbers near the header
  if (followers === '0') {
    const headerElement = document.querySelector('header')
    if (headerElement) {
      const headerText = headerElement.textContent || ''
      console.log("📊 [DEBUG] Header text sample:", headerText.substring(0, 200))
      
      // Look for large numbers that could be follower counts
      const largeNumbers = headerText.match(/(\d+(?:\.\d+)?[KM])/g) || []
      console.log("📊 [DEBUG] Large numbers found:", largeNumbers)
      
      if (largeNumbers.length >= 2) {
        followers = largeNumbers[0] || '0' // Usually followers is first large number
        following = largeNumbers[1] || '0'
      }
    }
  }
  
  console.log("📊 [DEBUG] Final extracted stats:", { posts, followers, following })
  
  // Check for verification badge
  const isVerified = document.querySelector('svg[aria-label*="Verified"], svg[aria-label*="verified"]') !== null
  
  // Check if private
  const isPrivate = allText.toLowerCase().includes('this account is private')
  
  const profile: InstagramProfile = {
    username,
    displayName,
    bio,
    location,  // Add this line
    profilePicture: extractProfilePicture(),
    followers,
    following,
    posts,
    isVerified,
    isPrivate,
    url: window.location.href,
    lastUpdated: Date.now()
  }
  
  console.log("✅ [DEBUG] Final extracted profile:", profile)
  return profile
}

function extractProfilePicture(): string {
  console.log("🖼️ [DEBUG] Extracting profile picture...")
  
  const selectors = [
    'img[alt*="profile picture"]',
    'header img[src*="profile"]',
    'header img:first-of-type',
    'img[style*="border-radius"]'
  ]
  
  for (const selector of selectors) {
    const img = document.querySelector(selector) as HTMLImageElement
    if (img?.src && img.src.startsWith('https://') && !img.src.includes('static')) {
      console.log("✅ [DEBUG] Found profile picture:", img.src.substring(0, 50))
      return img.src
    }
  }
  
  console.log("❌ [DEBUG] No profile picture found")
  return ''
}

function sendToBackground(profile: InstagramProfile | null) {
  console.log("📤 [DEBUG] Sending to background script...")
  
  try {
    if (!chrome.runtime?.id) {
      console.log("❌ [DEBUG] Extension context invalidated, skipping message")
      return
    }
    
    chrome.runtime.sendMessage({
      type: 'INSTAGRAM_PROFILE_UPDATE',
      data: profile
    }).then((response) => {
      console.log("✅ [DEBUG] Background response:", response)
    }).catch((error) => {
      console.log("❌ [DEBUG] Background error:", error?.message || error)
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.log("❌ [DEBUG] Failed to send message:", errorMessage)
  }
}

function checkAndSendProfile() {
  console.log("🔍 [DEBUG] Starting profile check...")
  const profile = extractSimpleProfile()
  sendToBackground(profile)
}

// Test function for manual testing
(window as any).testInstagram = () => {
  console.log("🧪 [DEBUG] Manual test triggered!")
  checkAndSendProfile()
}

// Start after page loads
setTimeout(() => {
  console.log("⏰ [DEBUG] Starting profile extraction...")
  checkAndSendProfile()
}, 3000)

// Check every 10 seconds
setInterval(() => {
  console.log("🔄 [DEBUG] Periodic check...")
  checkAndSendProfile()
}, 10000)

console.log("✅ [DEBUG] Instagram setup complete!")
console.log("💡 [DEBUG] Run 'testInstagram()' in console to test")