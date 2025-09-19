import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { contractConfig, postNFTContractConfig } from '../config/contract'
import ProfilePicture from './ProfilePicture'
import { MessageCircle, Heart, Repeat2, MoreHorizontal, BadgeCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMetaTransaction, sendMetaTransaction } from '../hooks/useMetaTransaction'

interface PostProps {
  postId: number
  postContent: string
  onPostUpdate?: () => void
  onNavigateToUser?: (userAddress: string) => void
}

export default function Post({ postId, postContent, onPostUpdate, onNavigateToUser }: PostProps) {
  const { address } = useAccount()
  const [commentContent, setCommentContent] = useState('')
  const [isLiking, setIsLiking] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [isMintingNFT, setIsMintingNFT] = useState(false)
  const [isListingNFT, setIsListingNFT] = useState(false)
  const [isDelistingNFT, setIsDelistingNFT] = useState(false)
  const [isBuyingNFT, setIsBuyingNFT] = useState(false)

  const { data: postData } = useReadContract({
    ...contractConfig,
    functionName: 'posts',
    args: [BigInt(postId)],
  })

  const { data: likeCount } = useReadContract({
    ...contractConfig,
    functionName: 'getPostLikes',
    args: [BigInt(postId)],
  })

  const { data: comments } = useReadContract({
    ...contractConfig,
    functionName: 'getPostComments',
    args: [BigInt(postId)],
  })

  const { data: userProfileId } = useReadContract({
    ...contractConfig,
    functionName: 'ownerToProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  const { data: hasUserLiked } = useReadContract({
    ...contractConfig,
    functionName: 'postLikes',
    args: userProfileId ? [BigInt(postId), userProfileId] : undefined,
    query: {
      enabled: !!userProfileId,
    },
  })

  const postAuthorProfileId = postData ? (postData as [bigint, string, bigint])[0] : BigInt(0)

  const { data: postAuthorAddress } = useReadContract({
    ...contractConfig,
    functionName: 'ownerOf',
    args: postAuthorProfileId ? [postAuthorProfileId] : undefined,
    query: {
      enabled: !!postAuthorProfileId && postAuthorProfileId > 0,
    },
  })

  const { data: postAuthorUsername, isLoading: isLoadingUsername } = useReadContract({
    ...contractConfig,
    functionName: 'profileUsernames',
    args: postAuthorAddress ? [postAuthorAddress] : undefined,
    query: {
      enabled: !!postAuthorAddress,
    },
  })

  const { data: postAuthorHasBlueMark } = useReadContract({
    ...contractConfig,
    functionName: 'hasBlueMark',
    args: postAuthorProfileId ? [postAuthorProfileId] : undefined,
    query: {
      enabled: !!postAuthorProfileId && postAuthorProfileId > 0,
    },
  })

  const { data: tokenId } = useReadContract({
    ...postNFTContractConfig,
    functionName: 'postIdToTokenId',
    args: [BigInt(postId)],
  })

  const { data: listingInfo } = useReadContract({
    ...postNFTContractConfig,
    functionName: 'listings',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && Number(tokenId) > 0,
    },
  })

  const { data: listingPrice } = useReadContract({
    ...postNFTContractConfig,
    functionName: 'listingPrice',
  })

  const { data: nftOwner } = useReadContract({
    ...postNFTContractConfig,
    functionName: 'ownerOf',
    args: tokenId ? [tokenId] : undefined,
    query: {
      enabled: !!tokenId && Number(tokenId) > 0,
    },
  })

  const { createMetaTransaction, isLoading: isMetaTxLoading } = useMetaTransaction()


  const handleToggleLike = async () => {
    if (!userProfileId) return

    setIsLiking(true)
    try {
      const { request, signature } = await createMetaTransaction(
        contractConfig.address as `0x${string}`,
        'toggleLike',
        [BigInt(postId)],
        0n,
        3000000n 
      )
      const relayerUrl = 'https://reuters-revolution-winter-ages.trycloudflare.com'
      await sendMetaTransaction(request, signature as `0x${string}`, relayerUrl)
      if (onPostUpdate) onPostUpdate()
    } catch (err) {
      console.error('Error toggling like:', err)
    } finally {
      setIsLiking(false)
    }
  }

  const handleCreateComment = async () => {
    if (!commentContent.trim() || !userProfileId) return

    setIsCommenting(true)
    try {
      const { request, signature } = await createMetaTransaction(
        contractConfig.address as `0x${string}`,
        'createComment',
        [BigInt(postId), commentContent.trim()],
        0n,
        3000000n
      )
      const relayerUrl = 'https://reuters-revolution-winter-ages.trycloudflare.com'
      await sendMetaTransaction(request, signature as `0x${string}`, relayerUrl)
      setCommentContent('')
      if (onPostUpdate) onPostUpdate()
    } catch (err) {
      console.error('Error creating comment:', err)
    } finally {
      setIsCommenting(false)
    }
  }

  const handleCreatePostNFT = async (listForSale: boolean = false) => {
    if (!userProfileId) return

    setIsMintingNFT(true)
    try {
      const { request, signature } = await createMetaTransaction(
        postNFTContractConfig.address as `0x${string}`,
        'createPostNFT',
        [BigInt(postId), listForSale],
        0n,
        3000000n,
        postNFTContractConfig.abi
      )
      const relayerUrl = 'https://reuters-revolution-winter-ages.trycloudflare.com'
      await sendMetaTransaction(request, signature as `0x${string}`, relayerUrl)
      if (onPostUpdate) onPostUpdate()
    } catch (err) {
      console.error('Error creating post NFT:', err)
    } finally {
      setIsMintingNFT(false)
    }
  }

  const handleListNFT = async () => {
    if (!tokenId) return

    setIsListingNFT(true)
    try {
      const { request, signature } = await createMetaTransaction(
        postNFTContractConfig.address as `0x${string}`,
        'listNFT',
        [tokenId as bigint],
        0n,
        3000000n,
        postNFTContractConfig.abi
      )
      const relayerUrl = 'https://reuters-revolution-winter-ages.trycloudflare.com'
      await sendMetaTransaction(request, signature as `0x${string}`, relayerUrl)
      if (onPostUpdate) onPostUpdate()
    } catch (err) {
      console.error('Error listing NFT:', err)
    } finally {
      setIsListingNFT(false)
    }
  }

  const handleDelistNFT = async () => {
    if (!tokenId) return

    setIsDelistingNFT(true)
    try {
      const { request, signature } = await createMetaTransaction(
        postNFTContractConfig.address as `0x${string}`,
        'delistNFT',
        [tokenId as bigint],
        0n,
        3000000n,
        postNFTContractConfig.abi
      )
      const relayerUrl = 'https://reuters-revolution-winter-ages.trycloudflare.com'
      await sendMetaTransaction(request, signature as `0x${string}`, relayerUrl)
      if (onPostUpdate) onPostUpdate()
    } catch (err) {
      console.error('Error delisting NFT:', err)
    } finally {
      setIsDelistingNFT(false)
    }
  }

  const handleBuyNFT = async () => {
    if (!tokenId || !listingInfo || !listingPrice) return

    setIsBuyingNFT(true)
    try {
      const { request, signature } = await createMetaTransaction(
        postNFTContractConfig.address as `0x${string}`,
        'buyNFT',
        [tokenId as bigint],
        listingPrice as bigint,
        3000000n,
        postNFTContractConfig.abi
      )
      const relayerUrl = 'https://reuters-revolution-winter-ages.trycloudflare.com'
      await sendMetaTransaction(request, signature as `0x${string}`, relayerUrl)
      if (onPostUpdate) onPostUpdate()
    } catch (err) {
      console.error('Error buying NFT:', err)
    } finally {
      setIsBuyingNFT(false)
    }
  }

  if (!postData) {
    return (
      <div className="p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-800 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    )
  }

  const [, content, postLikes] = postData as [bigint, string, bigint]
  
  const commentsData = comments as [string[], string[]] | undefined


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 mb-4 hover:shadow-md transition-shadow"
    >

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (postAuthorAddress && typeof postAuthorAddress === 'string') {
                onNavigateToUser?.(postAuthorAddress)
              }
            }}
            className="hover:opacity-80 transition-opacity duration-200"
          >
            <ProfilePicture 
              profileId={postAuthorProfileId || BigInt(0)} 
              size="md" 
              className="w-12 h-12"
            />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  if (postAuthorAddress && typeof postAuthorAddress === 'string') {
                    onNavigateToUser?.(postAuthorAddress)
                  }
                }}
                className="font-semibold text-gray-900 dark:text-white hover:text-blue-400 transition-colors duration-200"
              >
                {isLoadingUsername ? (
                  <span className="animate-pulse">@loading...</span>
                ) : postAuthorUsername ? (
                  `@${postAuthorUsername}`
                ) : (
                  '@user'
                )}
              </button>
              {postAuthorHasBlueMark === true ? (
                <BadgeCheck
                className="
                  h-6 w-6
                  text-white
                  fill-blue-500
                  stroke-white
                "
              />
              ) : null}
              <span className="text-sm text-gray-500 dark:text-gray-400">
                #{postId}
              </span>
            </div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-gray-900 dark:text-white text-base leading-relaxed">
          {content || postContent}
        </p>
      </div>

      <div className="flex items-center space-x-6 pb-3 border-b border-gray-100 dark:border-gray-800">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleToggleLike}
          disabled={!userProfileId || isLiking || isMetaTxLoading}
          className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors ${
            hasUserLiked
              ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
              : 'text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Heart className={`w-5 h-5 ${hasUserLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{String(Number(likeCount || postLikes || 0))}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{commentsData && commentsData[0] ? commentsData[0].length : 0}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-2 px-3 py-2 rounded-full text-gray-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
        >
          <Repeat2 className="w-5 h-5" />
        </motion.button>

        {userProfileId && typeof userProfileId === 'bigint' && userProfileId > 0 && userProfileId === postAuthorProfileId ? (
          <div className="flex items-center space-x-2">
            {!tokenId || Number(tokenId) === 0 ? (
              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCreatePostNFT(false)}
                  disabled={isMintingNFT || isMetaTxLoading}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm font-medium">{isMintingNFT || isMetaTxLoading ? 'Minting...' : 'Mint NFT'}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleCreatePostNFT(true)}
                  disabled={isMintingNFT || isMetaTxLoading}
                  className="flex items-center space-x-2 px-3 py-2 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="text-sm font-medium">{isMintingNFT || isMetaTxLoading ? 'Minting...' : 'Mint & List'}</span>
                </motion.button>
              </div>
            ) : nftOwner && typeof nftOwner === 'string' && nftOwner.toLowerCase() === address?.toLowerCase() ? (

              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-full">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-sm font-medium">NFT #{tokenId?.toString()}</span>
                </div>
                {listingInfo && Array.isArray(listingInfo) && (listingInfo as [string, bigint])[0] !== '0x0000000000000000000000000000000000000000' ? (

                  <div className="flex space-x-2">
                    <div className="flex items-center space-x-1 text-green-500 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-full">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                      </svg>
                      <span className="text-sm font-medium">Listed</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDelistNFT}
                      disabled={isDelistingNFT || isMetaTxLoading}
                      className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm font-medium transition-colors"
                    >
                      {isDelistingNFT || isMetaTxLoading ? 'Delisting...' : 'Delist'}
                    </motion.button>
                  </div>
                ) : (

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleListNFT}
                    disabled={isListingNFT || isMetaTxLoading}
                    className="px-3 py-2 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-sm font-medium transition-colors"
                  >
                    {isListingNFT || isMetaTxLoading ? 'Listing...' : 'List'}
                  </motion.button>
                )}
              </div>
            ) : (

              <div className="flex items-center space-x-1 text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-full">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span className="text-sm font-medium">NFT #{tokenId ? tokenId.toString() : '0'} (Sold)</span>
              </div>
            )}
          </div>
        ) : null}

        {userProfileId && typeof userProfileId === 'bigint' && nftOwner && typeof nftOwner === 'string' && nftOwner.toLowerCase() !== address?.toLowerCase() && tokenId && Number(tokenId) > 0 && listingInfo && Array.isArray(listingInfo) && (listingInfo as [string, bigint])[0] !== '0x0000000000000000000000000000000000000000' ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleBuyNFT}
            disabled={isBuyingNFT || isMetaTxLoading}
            className="flex items-center space-x-2 px-3 py-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            <span className="text-sm font-medium">{isBuyingNFT || isMetaTxLoading ? 'Buying...' : `Buy NFT (${listingPrice ? Number(listingPrice as bigint) / 1e18 : 0} ETH)`}</span>
          </motion.button>
        ) : null}
      </div>

      {showComments ? (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 space-y-4"
        >
          {userProfileId && typeof userProfileId === 'bigint' && userProfileId > 0 ? (
            <div className="flex space-x-3">
              <ProfilePicture 
                profileId={userProfileId} 
                size="sm" 
              />
              <div className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateComment}
                  disabled={!commentContent.trim() || !userProfileId || isCommenting || isMetaTxLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCommenting || isMetaTxLoading ? 'Posting...' : 'Post'}
                </motion.button>
              </div>
            </div>
          ) : null}

          {commentsData && commentsData[0] && commentsData[0].length > 0 ? (
            commentsData[0].map((commenter: string, index: number) => (
              <div key={index} className="flex space-x-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-white">
                    {commenter.slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        {commenter.slice(0, 6)}...{commenter.slice(-4)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        now
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {commentsData && commentsData[1] && commentsData[1][index]}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">No comments yet.</p>
          )}
        </motion.div>
      ) : null}
    </motion.div>
  )
}
