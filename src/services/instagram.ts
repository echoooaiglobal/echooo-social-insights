// src/services/instagram.ts
// Instagram profile service for handling Instagram data

import { Storage } from "@plasmohq/storage"
import type { InstagramProfile, ProfileDisplayData } from '../types/instagram'

export class InstagramService {
  private storage: Storage

  constructor() {
    this.storage = new Storage()
  }

  /**
   * Get current Instagram profile from storage
   */
  async getCurrentProfile(): Promise<InstagramProfile | null> {
    try {
      const profileData = await this.storage.get('currentInstagramProfile')
      if (!profileData) return null
      return JSON.parse(profileData as string) as InstagramProfile
    } catch (error) {
      console.error('❌ [InstagramService] Failed to get current profile:', error)
      return null
    }
  }

  /**
   * Format profile data for display in UI
   */
  formatProfileForDisplay(profile: InstagramProfile): ProfileDisplayData {
    const engagementRate = this.estimateEngagementRate(profile)
    const influenceTier = this.getInfluenceTier(profile)
    
    return {
      username: profile.username,
      displayName: profile.displayName,
      bio: this.truncateBio(profile.bio),
      location: profile.location || '', // Add this line
      profilePicture: profile.profilePicture,
      formattedFollowers: this.formatNumber(profile.followers),
      formattedFollowing: this.formatNumber(profile.following),
      formattedPosts: this.formatNumber(profile.posts),
      isVerified: profile.isVerified,
      isPrivate: profile.isPrivate,
      url: profile.url,
      canAddToList: !profile.isPrivate,
      engagementRate: engagementRate,
      influenceTier: influenceTier
    }
  }

  /**
   * Format large numbers for display (1000 -> 1K)
   */
  private formatNumber(value: string): string {
    if (!value || value === '0') return '0'
    
    // Handle already formatted numbers (e.g., "1.2K", "5.3M")
    if (value.match(/[kmb]$/i)) {
      return value.toUpperCase()
    }
    
    // Convert string to number and format
    const num = parseInt(value.replace(/,/g, ''), 10)
    
    if (isNaN(num)) return value
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace('.0', '') + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'K'
    }
    
    return num.toString()
  }

  /**
   * Truncate bio text for display
   */
  private truncateBio(bio: string): string {
    if (!bio) return ''
    
    const maxLength = 100
    if (bio.length <= maxLength) return bio
    
    return bio.substring(0, maxLength).trim() + '...'
  }

  /**
   * Check if current tab is Instagram
   */
  async isOnInstagram(): Promise<boolean> {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const currentTab = tabs[0]
      
      if (!currentTab?.url) return false
      
      return currentTab.url.includes('instagram.com')
    } catch (error) {
      console.error('❌ [InstagramService] Failed to check if on Instagram:', error)
      return false
    }
  }

  /**
   * Clear current profile from storage
   */
  async clearCurrentProfile(): Promise<void> {
    try {
      await this.storage.remove('currentInstagramProfile')
      console.log('✅ [InstagramService] Current profile cleared')
    } catch (error) {
      console.error('❌ [InstagramService] Failed to clear current profile:', error)
    }
  }

  /**
   * Check if profile is suitable for adding to campaign
   */
  canAddToList(profile: InstagramProfile): boolean {
    // Basic checks for adding to campaign
    if (profile.isPrivate) return false
    
    // Could add more checks here:
    // - Minimum follower count
    // - Account age
    // - Post frequency
    // - etc.
    
    return true
  }

  /**
   * Get profile engagement rate estimation
   */
  estimateEngagementRate(profile: InstagramProfile): string {
    // Parse follower count properly
    const followersStr = profile.followers.toLowerCase()
    let followers = 0
    
    if (followersStr.includes('m')) {
      followers = parseFloat(followersStr.replace('m', '')) * 1000000
    } else if (followersStr.includes('k')) {
      followers = parseFloat(followersStr.replace('k', '')) * 1000
    } else {
      followers = parseInt(followersStr.replace(/[^0-9]/g, '')) || 0
    }
    
    console.log('Calculating engagement for followers:', followers)
    
    if (followers === 0) return 'Unknown'
    
    // Industry standard engagement rates by follower count
    let rate = 0
    if (followers < 1000) rate = 8.0
    else if (followers < 10000) rate = 4.0
    else if (followers < 100000) rate = 2.5
    else if (followers < 1000000) rate = 1.8
    else rate = 1.2  // Mega influencers like Atif Aslam (10.7M)
    
    return `~${rate}%`
  }

  /**
   * Get influence tier based on follower count
   */
  getInfluenceTier(profile: InstagramProfile): string {
    const followersStr = profile.followers.toLowerCase()
    let followers = 0
    
    if (followersStr.includes('m')) {
      followers = parseFloat(followersStr) * 1000000
    } else if (followersStr.includes('k')) {
      followers = parseFloat(followersStr) * 1000
    } else {
      followers = parseInt(followersStr.replace(/[^0-9]/g, '')) || 0
    }
    
    if (followers >= 1000000) return 'Mega Influencer'
    else if (followers >= 100000) return 'Macro Influencer'
    else if (followers >= 10000) return 'Mid-tier Influencer'
    else if (followers >= 1000) return 'Micro Influencer'
    else return 'Nano Influencer'
  }
}