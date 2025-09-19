import { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts, useDisconnect } from 'wagmi'
import { contractConfig } from '../config/contract'
import Post from './Post'
import ProfilePicture from './ProfilePicture'
import { useFollowStats } from '../hooks/useFollow'
import { MapPin, BadgeCheck, LogOut, Users, UserCheck, Link } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Profile() {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { data: profileId } = useReadContract({
    ...contractConfig,
    functionName: 'ownerToProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const { data: username } = useReadContract({
    ...contractConfig,
    functionName: 'profileUsernames',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const { data: hasBlueMark } = useReadContract({
    ...contractConfig,
    functionName: 'hasProfileBlueMark',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const { data: blueMarkPrice } = useReadContract({
    ...contractConfig,
    functionName: 'blueMarkPrice',
  })

  const { data: nextPostId, refetch: refetchNextPostId } = useReadContract({
    ...contractConfig,
    functionName: 'nextPostId',
  })

  const postIdsToQuery = useMemo(() => {
    if (!nextPostId) return [] as bigint[]
    const n = Number(nextPostId)
    if (!Number.isFinite(n) || n <= 1) return [] as bigint[]
    const ids: bigint[] = []
    for (let i = 1; i < n; i++) ids.push(BigInt(i))
    return ids
  }, [nextPostId])

  const postsBatch = useReadContracts({
    allowFailure: true,
    contracts: postIdsToQuery.map((id) => ({
      ...contractConfig,
      functionName: 'posts',
      args: [id],
    })),
    query: {
      enabled: postIdsToQuery.length > 0,
    },
  })

  const myPostIds = useMemo(() => {
    if (!postsBatch?.data || !profileId) return [] as number[]
    const myId = BigInt(profileId as bigint)
    const result: number[] = []
    postsBatch.data.forEach((res, idx) => {
      if (!res || res.status !== 'success') return
      const value = res.result as unknown as [bigint, string, bigint]
      const [postProfileId] = value
      if (postProfileId === myId) {
        result.push(Number(postIdsToQuery[idx]))
      }
    })
    return result
  }, [postsBatch?.data, profileId, postIdsToQuery])

  const refetchPosts = async () => {
    await Promise.all([refetchNextPostId(), postsBatch.refetch()])
  }

  const handlePostUpdate = () => {
    setRefreshTrigger(prev => prev + 1)
    refetchPosts()
  }


  const { writeContract: writeBuyBlueMark, data: buyBlueMarkHash } = useWriteContract()

  const { isLoading: isBuyingBlueMarkTx, isSuccess: isBlueMarkPurchased } = useWaitForTransactionReceipt({
    hash: buyBlueMarkHash,
  })

  const { stats: followStats, isLoading: isLoadingFollowStats } = useFollowStats(address || '')

  useEffect(() => {
    if (isBlueMarkPurchased) {
      window.location.reload()
    }
  }, [isBlueMarkPurchased])

  const handleBuyBlueMark = async () => {
    if (!blueMarkPrice) return

    try {
      writeBuyBlueMark({
        ...contractConfig,
        functionName: 'buyBlueMark',
        args: [],
        value: BigInt(blueMarkPrice.toString()),
      })
    } catch (err) {
      console.error('Error buying blue mark:', err)
    }
  }

  const handleDisconnect = () => {
    try {
      disconnect()
    } catch (err) {
      console.error('Error disconnecting wallet:', err)
    }
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/30 overflow-hidden mb-8"
      >
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        <div className="px-6 pb-6">
          {/* Profile Picture */}
          <div className="relative -mt-16 mb-4">
            <ProfilePicture 
              profileId={profileId && typeof profileId === 'bigint' ? profileId : BigInt(0)} 
              size="xl" 
              showUpload={true}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 object-cover"
            />
          </div>

          {/* Profile Info */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-3xl font-bold text-white">
                  {String(username || 'Loading...')}
                </h1>
                {hasBlueMark === true ? (
                  <BadgeCheck
                  className="
                    h-6 w-6
                    text-white
                    fill-blue-500
                    stroke-white
                  "
                />
                ) : null}
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                <span className="flex items-center space-x-1">
                  <Link className="w-4 h-4" />
                  <span>Profile ID: {profileId ? String(profileId) : 'N/A'}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>Somnia Blockchain</span>
                </span>
              </div>
              <p className="text-gray-300 mb-3">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No address'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDisconnect}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Disconnect</span>
              </motion.button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex space-x-8 mt-6 pt-6 border-t border-slate-700/30">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {myPostIds.length}
              </div>
              <div className="text-sm text-gray-400">Posts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white flex items-center justify-center space-x-1">
                <Users className="w-5 h-5" />
                <span>{isLoadingFollowStats ? '...' : followStats.followersCount}</span>
              </div>
              <div className="text-sm text-gray-400">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white flex items-center justify-center space-x-1">
                <UserCheck className="w-5 h-5" />
                <span>{isLoadingFollowStats ? '...' : followStats.followingCount}</span>
              </div>
              <div className="text-sm text-gray-400">Following</div>
            </div>
          </div>
        </div>
        
        {/* Blue Mark Purchase Section */}
        {hasBlueMark !== true && blueMarkPrice ? (
          <div className="border-t border-slate-700/30 pt-6 px-6 pb-6">
            <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-blue-700/30">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center">
                    <BadgeCheck
        className="
          h-6 w-6
          text-white
          fill-blue-500
          stroke-white
        "
      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Get Verified</h3>
                      <div className="text-sm text-gray-400">
                    <div>
                      {blueMarkPrice ? Number(blueMarkPrice as bigint) / 1e18 : 0} STT One-time payment
                    </div>
                    <div className="text-sm text-gray-400"></div>
                  </div>
                  
                    </div>
                  </div>
                </div>
                <div className="ml-6 flex flex-col items-end">
        
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBuyBlueMark}
                    disabled={isBuyingBlueMarkTx}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed px-8 py-3 rounded-full font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center space-x-2"
                  >
                    {isBuyingBlueMarkTx ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <BadgeCheck
        className="
          h-6 w-6
          text-white
          fill-blue-500
          stroke-white
        "
      />
                        <span>Get Verified</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* Posts Section */}
      <div>
        <motion.h2
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-white mb-6"
        >
          Your Posts
        </motion.h2>

        {myPostIds && myPostIds.length > 0 ? (
          <div className="space-y-4">
            {myPostIds.map((postId, index) => (
              <motion.div
                key={`${postId}-${refreshTrigger}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Post
                  postId={postId}
                  postContent=""
                  onPostUpdate={handlePostUpdate}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-700/30"
          >
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No posts yet
            </h3>
            <p className="text-gray-400">
              Share your first post to get started!
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
