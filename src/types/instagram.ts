// src/types/instagram.ts
// Instagram profile related types

export interface InstagramProfile {
  username: string
  displayName: string
  bio: string
  location?: string  // Add this line
  profilePicture: string
  followers: string
  following: string
  posts: string
  isVerified: boolean
  isPrivate: boolean
  url: string
  lastUpdated: number
}

export interface InstagramProfileState {
  profile: InstagramProfile | null
  loading: boolean
  error: string | null
  isOnInstagram: boolean
  isOnProfilePage: boolean
}

export interface ProfileDisplayData {
  username: string
  displayName: string
  bio: string
  location?: string  // Add this line
  profilePicture: string
  formattedFollowers: string
  formattedFollowing: string
  formattedPosts: string
  isVerified: boolean
  isPrivate: boolean
  url: string
  canAddToList: boolean
  engagementRate?: string
  influenceTier?: string
}

// Utility type for profile update messages
export interface InstagramProfileMessage {
  type: 'INSTAGRAM_PROFILE_UPDATE'
  data: InstagramProfile | null
}