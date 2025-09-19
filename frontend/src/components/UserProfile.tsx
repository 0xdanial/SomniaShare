import { useState, useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { contractConfig } from '../config/contract'
import Post from './Post'
import ProfilePicture from './ProfilePicture'
import FollowButton from './FollowButton'
import { useFollowStats } from '../hooks/useFollow'
import { MapPin, BadgeCheck, ArrowLeft, Users, UserCheck } from 'lucide-react'

interface UserProfileProps {
  targetAddress: string
  onBack: () => void
  onFollowChange?: () => void
}

export default function UserProfile({ targetAddress, onBack, onFollowChange }: UserProfileProps) {
  const { address: currentUserAddress } = useAccount()
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { data: targetProfileId } = useReadContract({
    ...contractConfig,
    functionName: 'ownerToProfile',
    args: [targetAddress],
  })

  const { data: targetUsername } = useReadContract({
    ...contractConfig,
    functionName: 'profileUsernames',
    args: [targetAddress],
  })

  const { data: targetHasBlueMark } = useReadContract({
    ...contractConfig,
    functionName: 'hasProfileBlueMark',
    args: [targetAddress],
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

  const targetUserPostIds = useMemo(() => {
    if (!postsBatch?.data || !targetProfileId) return [] as number[]
    const targetId = BigInt(targetProfileId as bigint)
    const result: number[] = []
    postsBatch.data.forEach((res, idx) => {
      if (!res || res.status !== 'success') return
      const value = res.result as unknown as [bigint, string, bigint]
      const [postProfileId] = value
      if (postProfileId === targetId) {
        result.push(Number(postIdsToQuery[idx]))
      }
    })
    return result
  }, [postsBatch?.data, targetProfileId, postIdsToQuery])

  const refetchPosts = async () => {
    await Promise.all([refetchNextPostId(), postsBatch.refetch()])
  }

  const handlePostUpdate = () => {
    setRefreshTrigger(prev => prev + 1)
    refetchPosts()
  }

  const handleFollowChange = () => {
    refreshStats() 
    onFollowChange?.() 
  }

  const { stats: followStats, isLoading: isLoadingFollowStats, refreshStats } = useFollowStats(targetAddress)

  const isCurrentUser = currentUserAddress?.toLowerCase() === targetAddress.toLowerCase()

  if (!targetProfileId || Number(targetProfileId) === 0) {
    return (
      <div className="min-h-screen">
        <div className="mt-6 bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700/30">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <BadgeCheck
        className="
          h-6 w-6
          text-white
          fill-blue-500
          stroke-white
        "
      />
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">Profile Not Found</h3>
          <p className="text-gray-400 mb-4">This user hasn't created a profile yet.</p>
          <button
            onClick={onBack}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium transition-colors duration-200 flex items-center space-x-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">

      <div className="mt-6 mb-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>


      <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/30">
        <div className="flex items-start space-x-4">
          <ProfilePicture 
            profileId={targetProfileId && typeof targetProfileId === 'bigint' ? targetProfileId : BigInt(0)} 
            size="xl" 
            showUpload={false}
            className="flex-shrink-0"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h1 className="text-2xl font-bold text-white">
                {String(targetUsername || 'Loading...')}
              </h1>
              {targetHasBlueMark === true ? (
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
            <div className="flex items-center text-gray-500 text-sm mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              Somnia Blockchain
            </div>
            <div className="flex space-x-6 text-sm mb-4">
              <div className="text-center">
                <div className="font-bold text-white">{targetUserPostIds.length}</div>
                <div className="text-gray-500">Tweets</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white flex items-center justify-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{isLoadingFollowStats ? '...' : followStats.followersCount}</span>
                </div>
                <div className="text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white flex items-center justify-center space-x-1">
                  <UserCheck className="w-4 h-4" />
                  <span>{isLoadingFollowStats ? '...' : followStats.followingCount}</span>
                </div>
                <div className="text-gray-500">Following</div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-400 text-sm">
                {targetAddress ? `${targetAddress.slice(0, 6)}...${targetAddress.slice(-4)}` : 'No address'}
              </p>
              
              {!isCurrentUser && currentUserAddress && (
                <FollowButton 
                  followerId={currentUserAddress} 
                  followingId={targetAddress} 
                  size="md"
                  variant="default"
                  onFollowChange={handleFollowChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        {targetUserPostIds && targetUserPostIds.length > 0 ? (
          targetUserPostIds.map((postId) => (
            <Post
              key={`${postId}-${refreshTrigger}`}
              postId={postId}
              postContent=""
              onPostUpdate={handlePostUpdate}
            />
          ))
        ) : (
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700/30">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">No posts yet</h3>
            <p className="text-gray-400">This user hasn't shared anything yet!</p>
          </div>
        )}
      </div>
    </div>
  )
}
