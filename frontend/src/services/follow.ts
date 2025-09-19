import { supabase } from '../config/supabase'

export interface FollowData {
  followerId: string
  followingId: string
  createdAt: string
}

export interface FollowStats {
  followersCount: number
  followingCount: number
}

export class FollowService {
  private static readonly TABLE_NAME = 'follows'

  static async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .select('count')
        .limit(1)

      if (error) {
        console.error('Supabase connection test failed:', error)
        return false
      }

      console.log('Supabase connection test successful')
      return true
    } catch (error) {
      console.error('Supabase connection test error:', error)
      return false
    }
  }

  static async followUser(followerId: string, followingId: string): Promise<void> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself')
    }

    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .insert({
          follower_id: followerId,
          following_id: followingId,
          created_at: new Date().toISOString()
        })

      if (error) {
        if (error.code === '23505') {

          console.log('Already following this user')
          return
        }
        console.error('Supabase error following user:', error)
        throw new Error(`Follow failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Error following user:', error)
      throw error
    }
  }

  static async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(this.TABLE_NAME)
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)

      if (error) {
        console.error('Supabase error unfollowing user:', error)
        throw new Error(`Unfollow failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Error unfollowing user:', error)
      throw error
    }
  }

  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .limit(1)

      if (error) {
        console.error('Supabase error:', error)
        throw new Error(`Check follow status failed: ${error.message}`)
      }

      return data && data.length > 0
    } catch (error) {
      console.error('Error checking follow status:', error)
      return false
    }
  }

  static async getFollowers(profileId: string): Promise<FollowData[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('following_id', profileId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error getting followers:', error)
        throw new Error(`Get followers failed: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error getting followers:', error)
      return []
    }
  }

  static async getFollowing(profileId: string): Promise<FollowData[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE_NAME)
        .select('*')
        .eq('follower_id', profileId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error getting following:', error)
        throw new Error(`Get following failed: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error getting following:', error)
      return []
    }
  }

  static async getFollowStats(profileId: string): Promise<FollowStats> {
    const [followers, following] = await Promise.all([
      this.getFollowers(profileId),
      this.getFollowing(profileId)
    ])

    return {
      followersCount: followers.length,
      followingCount: following.length
    }
  }

  static async getFollowersWithDetails(profileId: string): Promise<FollowData[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        follower:profiles!follows_follower_id_fkey(
          id,
          username,
          created_at
        )
      `)
      .eq('following_id', profileId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Get followers with details failed: ${error.message}`)
    }

    return data || []
  }

  static async getFollowingWithDetails(profileId: string): Promise<FollowData[]> {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select(`
        *,
        following:profiles!follows_following_id_fkey(
          id,
          username,
          created_at
        )
      `)
      .eq('follower_id', profileId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Get following with details failed: ${error.message}`)
    }

    return data || []
  }
}
