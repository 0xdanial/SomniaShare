import React, { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract, useReadContracts } from 'wagmi'
import { contractConfig, adContractConfig } from '../config/contract'
import { useMetaTransaction, sendMetaTransaction } from '../hooks/useMetaTransaction'
import Post from './Post'
import Ad from './Ad'
import SomniaMockPost from './SomniaMockPost'
import ProfilePicture from './ProfilePicture'
import { motion } from 'framer-motion'

interface MainInterfaceProps {
  onNavigateToUser?: (userAddress: string) => void
  onFollowChange?: () => void
}

export default function MainInterface({ onNavigateToUser, onFollowChange }: MainInterfaceProps) {
  const { address } = useAccount()
  const [postContent, setPostContent] = useState('')
  const [isCreatingPost, setIsCreatingPost] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { data: profileId } = useReadContract({
    ...contractConfig,
    functionName: 'ownerToProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
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

  const allPostIds = useMemo(() => {
    if (!postsBatch?.data) return [] as number[]
    const result: number[] = []
    postsBatch.data.forEach((res, idx) => {
      if (!res || res.status !== 'success') return
      const value = res.result as unknown as [bigint, string, bigint]
      const [postProfileId] = value

      if (postProfileId > 0) {
        result.push(Number(postIdsToQuery[idx]))
      }
    })

    return result.reverse()
  }, [postsBatch?.data, postIdsToQuery])

  const refetchPosts = async () => {
    await Promise.all([refetchNextPostId(), postsBatch.refetch(), refetchActiveAds()])
  }

  const handlePostUpdate = () => {
    setRefreshTrigger(prev => prev + 1)
    refetchPosts()
  }

  const { createMetaTransaction, isLoading: isMetaTxLoading } = useMetaTransaction()
  const [isPostCreated, setIsPostCreated] = useState(false)

  const { data: activeAds, refetch: refetchActiveAds } = useReadContract({
    ...adContractConfig,
    functionName: 'getActiveAds',
  })

  useEffect(() => {
    if (isPostCreated) {
      refetchPosts()
    }
  }, [isPostCreated])

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchPosts()
    }
  }, [refreshTrigger])

  const handleCreatePost = async () => {
    if (!postContent.trim()) return

    setIsCreatingPost(true)
    try {
      const { request, signature } = await createMetaTransaction(
        contractConfig.address as `0x${string}`,
        'createPost',
        [postContent.trim()],
        0n,
        3000000n
      )

      const relayerUrl = 'https://reuters-revolution-winter-ages.trycloudflare.com'
      await sendMetaTransaction(request, signature as `0x${string}` , relayerUrl)

      setIsPostCreated(true)
      setPostContent('')
      handlePostUpdate()
      onFollowChange?.()
    } catch (err) {
      console.error('Error creating post:', err)
    } finally {
      setIsCreatingPost(false)
    }
  }


  const isLoading = !postsBatch?.data && postIdsToQuery.length > 0

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mt-6 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Latest Posts
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Discover what's happening on the blockchain
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6"
        >
        <div className="flex space-x-4">
          <ProfilePicture 
            profileId={profileId && typeof profileId === 'bigint' ? profileId : BigInt(0)} 
            size="md" 
            className="flex-shrink-0"
          />
          <div className="flex-1">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What's happening?"
                rows={3}
                  className="w-full bg-transparent text-xl placeholder-gray-400 resize-none focus:outline-none text-gray-900 dark:text-white"
              />
              <div className="flex items-center justify-between"> 
                <div></div>
              <button
                onClick={handleCreatePost}
                disabled={!postContent.trim() || isCreatingPost || isMetaTxLoading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-full font-bold text-white transition-colors duration-200"
              >
                {isCreatingPost || isMetaTxLoading ? 'Posting...' : 'Post'}
              </button>
            </div>
            </div>
            </div>
          </div>
        </motion.div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6"
              >
                <div className="animate-pulse">
                  <div className="flex space-x-4">
                    <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">

            {activeAds && Array.isArray(activeAds) && activeAds.length > 0 ? (
              <div>
                {(activeAds[0] as bigint[]).map((adId: bigint, index: number): React.ReactElement => {
                  const content = (activeAds[1] as string[])[index] || ''
                  return (
                    <motion.div
                      key={`ad-${adId}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Ad
                        adId={Number(adId)}
                        content={content}
                      />
                    </motion.div>
                  )
                })}
              </div>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SomniaMockPost />
            </motion.div>

            {allPostIds && allPostIds.length > 0 ? (
              allPostIds.map((postId, index) => (
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
              onNavigateToUser={onNavigateToUser}
            />
                </motion.div>
          ))
        ) : (
          !activeAds || !Array.isArray(activeAds) || activeAds.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="text-6xl mb-4">🌟</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Be the first to share something on the somnia blockchain!
                  </p>
                </motion.div>
              ) : null
            )}
            </div>
        )}
      </div>
    </div>
  )
}
