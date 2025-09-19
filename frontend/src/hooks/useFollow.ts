import { useState, useEffect } from 'react'
import { FollowService } from '../services/follow'

interface FollowStats {
  followersCount: number
  followingCount: number
}

export function useFollow(followerId: string, followingId: string, onFollowChange?: () => void) {
  const [isFollowing, setIsFollowing] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)

  useEffect(() => {
    if (followerId && followingId) {
      checkFollowStatus()
    }
  }, [followerId, followingId])

  const checkFollowStatus = async () => {
    try {
      setIsLoading(true)
      const status = await FollowService.isFollowing(followerId, followingId)
      setIsFollowing(status)
    } catch (error) {
      console.error('Error checking follow status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleFollow = async () => {
    if (!followerId || !followingId || isToggling) return

    try {
      setIsToggling(true)
      
      if (isFollowing) {
        await FollowService.unfollowUser(followerId, followingId)
        setIsFollowing(false)
      } else {
        await FollowService.followUser(followerId, followingId)
        setIsFollowing(true)
      }
      
      onFollowChange?.()
    } catch (error) {
      console.error('Error toggling follow:', error)
      alert('Failed to update follow status. Please try again.')
    } finally {
      setIsToggling(false)
    }
  }

  return {
    isFollowing,
    isLoading,
    isToggling,
    toggleFollow
  }
}

export function useFollowStats(profileId: string) {
  const [stats, setStats] = useState<FollowStats>({ followersCount: 0, followingCount: 0 })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (profileId) {
      loadStats()
    }
  }, [profileId])

  const loadStats = async () => {
    try {
      setIsLoading(true)
      
      const connectionOk = await FollowService.testConnection()
      if (!connectionOk) {
        console.error('Supabase connection failed')
        return
      }
      
      const followStats = await FollowService.getFollowStats(profileId)
      setStats(followStats)
    } catch (error) {
      console.error('Error loading follow stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStats = () => {
    loadStats()
  }

  return {
    stats,
    isLoading,
    refreshStats
  }
}
