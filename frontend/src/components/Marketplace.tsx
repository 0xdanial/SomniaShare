import { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { contractConfig, postNFTContractConfig } from '../config/contract'
import ProfilePicture from './ProfilePicture'
import FollowButton from './FollowButton'
import { useMetaTransaction, sendMetaTransaction } from '../hooks/useMetaTransaction'
import { ShoppingCart, Star, BadgeCheck } from 'lucide-react'

interface ListedNFT {
  tokenId: bigint
  postId: bigint
  seller: string
  price: bigint
  postContent: string
  postAuthor: string
  postAuthorUsername: string
  postAuthorHasBlueMark: boolean
}

interface MarketplaceProps {
  onNavigateToUser?: (userAddress: string) => void
  onFollowChange?: () => void
}

export default function Marketplace({ onNavigateToUser, onFollowChange }: MarketplaceProps) {
  const { address } = useAccount()
  const [isBuyingNFT, setIsBuyingNFT] = useState<{ [key: string]: boolean }>({})
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { data: profileId } = useReadContract({
    ...contractConfig,
    functionName: 'ownerToProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  })

  useReadContract({
    ...postNFTContractConfig,
    functionName: 'listings',
    args: [1n],
    query: {
      enabled: true,
    },
  })

  const listing1 = useReadContract({
    ...postNFTContractConfig,
    functionName: 'listings',
    args: [1n],
    query: { enabled: true },
  })

  const listing2 = useReadContract({
    ...postNFTContractConfig,
    functionName: 'listings',
    args: [2n],
    query: { enabled: true },
  })

  const listing3 = useReadContract({
      ...postNFTContractConfig,
      functionName: 'listings',
    args: [3n],
    query: { enabled: true },
  })

  const individualListings = [listing1, listing2, listing3]

  const postId1 = useReadContract({
    ...postNFTContractConfig,
    functionName: 'tokenIdToPostId',
    args: [1n],
    query: { enabled: true },
  })

  const postId2 = useReadContract({
    ...postNFTContractConfig,
    functionName: 'tokenIdToPostId',
    args: [2n],
    query: { enabled: true },
  })

  const postId3 = useReadContract({
      ...postNFTContractConfig,
      functionName: 'tokenIdToPostId',
    args: [3n],
    query: { enabled: true },
  })

  const individualPostIds = [postId1, postId2, postId3]

  const post1 = useReadContract({
    ...contractConfig,
    functionName: 'posts',
    args: postId1.data ? [postId1.data as bigint] : [0n],
    query: { enabled: !!postId1.data && postId1.isSuccess },
  })

  const post2 = useReadContract({
    ...contractConfig,
    functionName: 'posts',
    args: postId2.data ? [postId2.data as bigint] : [0n],
    query: { enabled: !!postId2.data && postId2.isSuccess },
  })

  const post3 = useReadContract({
      ...contractConfig,
      functionName: 'posts',
    args: postId3.data ? [postId3.data as bigint] : [0n],
    query: { enabled: !!postId3.data && postId3.isSuccess },
  })

  const individualPosts = [post1, post2, post3]

  const address1 = useReadContract({
    ...contractConfig,
    functionName: 'ownerOf',
    args: post1.data ? [(post1.data as [bigint, string, bigint])[0]] : [0n],
    query: { enabled: !!post1.data && post1.isSuccess },
  })

  const address2 = useReadContract({
    ...contractConfig,
    functionName: 'ownerOf',
    args: post2.data ? [(post2.data as [bigint, string, bigint])[0]] : [0n],
    query: { enabled: !!post2.data && post2.isSuccess },
  })

  const address3 = useReadContract({
    ...contractConfig,
    functionName: 'ownerOf',
    args: post3.data ? [(post3.data as [bigint, string, bigint])[0]] : [0n],
    query: { enabled: !!post3.data && post3.isSuccess },
  })

  const individualAddresses = [address1, address2, address3]

  const username1 = useReadContract({
          ...contractConfig,
          functionName: 'profileUsernames',
    args: address1.data ? [address1.data as string] : ['0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address1.data && address1.isSuccess },
  })

  const username2 = useReadContract({
        ...contractConfig,
        functionName: 'profileUsernames',
    args: address2.data ? [address2.data as string] : ['0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address2.data && address2.isSuccess },
  })

  const username3 = useReadContract({
      ...contractConfig,
    functionName: 'profileUsernames',
    args: address3.data ? [address3.data as string] : ['0x0000000000000000000000000000000000000000'],
    query: { enabled: !!address3.data && address3.isSuccess },
  })

  const individualUsernames = [username1, username2, username3]

  const listedNFTs = useMemo((): ListedNFT[] => {


    const result: ListedNFT[] = []
    
    individualListings.forEach((listing, idx) => {
      if (listing.data && listing.isSuccess) {

        let seller: string
        let price: bigint
        
        if (Array.isArray(listing.data)) {

          seller = listing.data[0] as string
          price = listing.data[1] as bigint
        } else if (listing.data && typeof listing.data === 'object' && 'seller' in listing.data && 'price' in listing.data) {

          seller = (listing.data as { seller: string, price: bigint }).seller
          price = (listing.data as { seller: string, price: bigint }).price
        } else {

          return
        }
        
        const tokenId = BigInt(idx + 1)
        

        
        if (seller && price && seller !== '0x0000000000000000000000000000000000000000' && price > 0) {

          const postIdRes = individualPostIds[idx]
          const postRes = individualPosts[idx]
          const usernameRes = individualUsernames[idx]
          
          let postId = 0n
          let postContent = `NFT #${tokenId.toString()} - Listed for ${String(Number(price) / 1e18)} STT`
          let postAuthor = seller
          let postAuthorUsername = 'Unknown'
          let postAuthorHasBlueMark = false
          
          if (postIdRes.data && postIdRes.isSuccess) {
            postId = postIdRes.data as bigint
          }
          
          if (postRes.data && postRes.isSuccess) {
            const [, content] = postRes.data as [bigint, string, bigint]
            postContent = content
            
            const addressRes = individualAddresses[idx]
            if (addressRes.data && addressRes.isSuccess) {
              postAuthor = addressRes.data as string
            }
          }
          
          if (usernameRes.data && usernameRes.isSuccess) {
            postAuthorUsername = String(usernameRes.data)
          }
          
                result.push({
                  tokenId,
                  postId,
                  seller,
                  price,
            postContent,
            postAuthor,
            postAuthorUsername,
            postAuthorHasBlueMark,
          })
        }
      }
    })


    return result
  }, [individualListings])

  const { createMetaTransaction, isLoading: isMetaTxLoading } = useMetaTransaction()

  const handleBuyNFT = async (tokenId: bigint, price: bigint) => {
    setIsBuyingNFT(prev => ({ ...prev, [tokenId.toString()]: true }))
    try {
      const { request, signature } = await createMetaTransaction(
        postNFTContractConfig.address as `0x${string}`,
        'buyNFT',
        [tokenId],
        price,
        3000000n,
        postNFTContractConfig.abi
      )
      const relayerUrl = 'https://reuters-revolution-winter-ages.trycloudflare.com'
      await sendMetaTransaction(request, signature as `0x${string}`, relayerUrl)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Error buying NFT:', err)
    } finally {
      setIsBuyingNFT(prev => ({ ...prev, [tokenId.toString()]: false }))
    }
  }

  const refetchAll = async () => {
    await Promise.all([
      listing1.refetch(),
      listing2.refetch(),
      listing3.refetch(),
      postId1.refetch(),
      postId2.refetch(),
      postId3.refetch(),
      post1.refetch(),
      post2.refetch(),
      post3.refetch(),
      address1.refetch(),
      address2.refetch(),
      address3.refetch(),
      username1.refetch(),
      username2.refetch(),
      username3.refetch(),
    ])
  }

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetchAll()
    }
  }, [refreshTrigger])

  return (
    <div className="min-h-screen">


      <div className="max-w-7xl mx-auto">


        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">

          {listedNFTs && listedNFTs.length > 0 && (
            <div className="col-span-full mb-8">
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-700/30">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Featured NFTs</h3>
                    <p className="text-gray-400">Discover unique posts turned into digital collectibles</p>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>{listedNFTs.length} NFTs available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>Live trading</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {listedNFTs && listedNFTs.length > 0 ? (
            listedNFTs.map((nft) => (
              <div key={nft.tokenId.toString()} className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/30 hover:bg-slate-800/80 hover:border-slate-600/50 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300 group relative overflow-hidden min-h-[380px] flex flex-col w-full">

                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <div className="flex items-start justify-between mb-6 relative z-10">
                  <div className="flex items-center space-x-4">
                  <button
                    onClick={() => onNavigateToUser?.(nft.postAuthor)}
                    className="hover:opacity-80 transition-opacity duration-200"
                  >
                      <ProfilePicture 
                        profileId={nft.postAuthor} 
                        size="md" 
                      />
                  </button>
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                      <button
                        onClick={() => onNavigateToUser?.(nft.postAuthor)}
                          className="font-bold text-white text-base hover:text-blue-400 transition-colors duration-200"
                      >
                        @{nft.postAuthorUsername}
                      </button>
                      {nft.postAuthorHasBlueMark && (
                          <BadgeCheck
                          className="
                            h-6 w-6
                            text-white
                            fill-blue-500
                            stroke-white
                          "
                        />
                      )}
                    </div>
                      <p className="text-gray-400 text-sm">
                      {nft.postAuthor.slice(0, 6)}...{nft.postAuthor.slice(-4)}
                    </p>
                  </div>
                </div>

                  <div className="flex items-center space-x-2 bg-purple-900/30 border border-purple-700/50 rounded-full px-3 py-1 absolute top-3 right-0">
                    <Star className="w-4 h-4 text-purple-400" />
                    <span className="text-purple-400 font-semibold text-xs">NFT #{nft.tokenId.toString()}</span>
                  </div>
                </div>

                <div className="mb-8 relative z-10 flex-1">
                  <div className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30 group-hover:bg-slate-700/50 transition-colors duration-300 h-full">
                    <p className="text-white text-base leading-relaxed">
                      {nft.postContent}
                    </p>
                  </div>
                </div>

                <div className="space-y-6 relative z-10 mt-auto">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-3xl font-bold text-white mb-1">
                        {String(Number(nft.price) / 1e18)} STT
                      </div>
                      <div className="text-gray-400 text-sm">
                        Post #{nft.postId.toString()}
                      </div>
                    </div>
                    
                    {profileId && nft.seller.toLowerCase() !== address?.toLowerCase() ? (
                      <button
                        onClick={() => handleBuyNFT(nft.tokenId, nft.price)}
                        disabled={isBuyingNFT[nft.tokenId.toString()] || isMetaTxLoading}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed px-5 py-2.5 rounded-full font-semibold text-white transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:shadow-none"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span className="text-sm">{isBuyingNFT[nft.tokenId.toString()] || isMetaTxLoading ? 'Buying...' : 'Buy NFT'}</span>
                      </button>
                    ) : null}
                  </div>

                  <div className="border-t border-slate-700/30"></div>
                  
                  {profileId && nft.seller.toLowerCase() !== address?.toLowerCase() ? (
                    <div className="flex justify-center">
                      <FollowButton 
                        followerId={address || ''} 
                        followingId={nft.postAuthor} 
                        size="md"
                        variant="ghost"
                        onFollowChange={onFollowChange}
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-700/30">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">NFT Marketplace is Live!</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Turn your posts into NFTs and trade them with the community. Each post can become a unique digital collectible!
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-2xl mb-2">🎨</div>
                    <h4 className="font-semibold text-white text-sm">Mint Posts</h4>
                    <p className="text-gray-400 text-xs">Turn your posts into NFTs</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-2xl mb-2">💰</div>
                    <h4 className="font-semibold text-white text-sm">Set Prices</h4>
                    <p className="text-gray-400 text-xs">List for sale at your price</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-2xl mb-2">🔄</div>
                    <h4 className="font-semibold text-white text-sm">Trade Freely</h4>
                    <p className="text-gray-400 text-xs">Buy and sell with others</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Start by creating a post and minting it as an NFT!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
