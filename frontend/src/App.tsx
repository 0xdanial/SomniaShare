import { useAccount, useConnect } from 'wagmi'
import { useReadContract, useReadContracts } from 'wagmi'
import { useEffect, useState, useMemo } from 'react'
import { contractConfig } from './config/contract'
import CreateProfile from './components/CreateProfile'
import MainInterface from './components/MainInterface'
import Profile from './components/Profile'
import UserProfile from './components/UserProfile'
import Marketplace from './components/Marketplace'
import Advertisement from './components/Advertisement'
import ProfilePicture from './components/ProfilePicture'
import FollowButton from './components/FollowButton'
import { Landing } from './components/Landing'
import { useFollowStats } from './hooks/useFollow'
import { Megaphone, Home, User, ShoppingCart, Search, MapPin, BadgeCheck, Users, UserCheck, Plus } from 'lucide-react'

function App() {
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const [currentView, setCurrentView] = useState<'home' | 'profile' | 'marketplace' | 'advertisement' | 'user-profile'>('home')
  const [viewingUserAddress, setViewingUserAddress] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [profileRefreshTrigger, setProfileRefreshTrigger] = useState(0)

  const { data: profileId, refetch: refetchProfile } = useReadContract({
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

  const { data: nextPostId } = useReadContract({
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

  const userPostCount = useMemo(() => {
    if (!postsBatch?.data || !profileId) return 0
    const myId = BigInt(profileId as bigint)
    let count = 0
    postsBatch.data.forEach((res) => {
      if (!res || res.status !== 'success') return
      const value = res.result as unknown as [bigint, string, bigint]
      const [postProfileId] = value
      if (postProfileId === myId) {
        count++
      }
    })
    return count
  }, [postsBatch?.data, profileId, profileRefreshTrigger])

  const hasProfile = profileId && Number(profileId) > 0

  const { stats: followStats, isLoading: isLoadingFollowStats, refreshStats } = useFollowStats(address || '')

  const navigateToUserProfile = (userAddress: string) => {
    setViewingUserAddress(userAddress)
    setCurrentView('user-profile')
  }

  const navigateBack = () => {
    setViewingUserAddress(null)
    setCurrentView('home')
  }

  const refreshProfileCard = () => {
    setProfileRefreshTrigger(prev => prev + 1)
    refetchProfile()
    refreshStats()
  }

  useEffect(() => {
    if (isConnected && address) {
      const interval = setInterval(() => {
        refetchProfile()
      }, 3000)

      return () => clearInterval(interval)
    }
  }, [isConnected, address, refetchProfile])

  if (!isConnected) {
    return (
      <Landing 
        onConnectWallet={() => connect({ connector: connectors[0] })}
        isConnecting={false}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 from-slate-900 to-slate-800 text-white font-sans">

      <div className="bg-gray-950 backdrop-blur-sm border-b border-slate-700/30 mb-[-20px]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">

            <div>
              <h1 className="text-2xl font-bold text-white">
                SomniaShare
              </h1>
            </div>

            <div className="flex-1 max-w-sm mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-600/50 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 max-w-7xl mx-auto flex">
        <div className="w-64 p-6 space-y-4">
          <div className="space-y-2">
            <button 
              onClick={() => setCurrentView('home')}
              className={`flex items-center space-x-4 py-3 px-3 rounded-full hover:bg-slate-800/50 cursor-pointer w-full ${
                currentView === 'home' ? 'bg-slate-800/50' : ''
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xl font-normal">Home</span>
            </button>
            
            <button 
              onClick={() => setCurrentView('profile')}
              className={`flex items-center space-x-4 py-3 px-3 rounded-full hover:bg-slate-800/50 cursor-pointer w-full ${
                currentView === 'profile' ? 'bg-slate-800/50' : ''
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xl font-normal">Profile</span>
            </button>
            
            <button 
              onClick={() => setCurrentView('marketplace')}
              className={`flex items-center space-x-4 py-3 px-3 rounded-full hover:bg-slate-800/50 cursor-pointer w-full ${
                currentView === 'marketplace' ? 'bg-slate-800/50' : ''
              }`}
            >
              <ShoppingCart className="w-6 h-6" />
              <span className="text-xl font-normal">Marketplace</span>
            </button>
            
            <button 
              onClick={() => setCurrentView('advertisement')}
              className={`flex items-center space-x-4 py-3 px-3 rounded-full hover:bg-slate-800/50 cursor-pointer w-full ${
                currentView === 'advertisement' ? 'bg-slate-800/50' : ''
              }`}
            >
              <Megaphone className="w-6 h-6" />
              <span className="text-xl font-normal">Advertisement</span>
            </button>
          </div>

          <button 
            onClick={() => setCurrentView('home')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <Plus className="w-6 h-6" />
            <span className="text-lg">Create Post</span>
          </button>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/30">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Somnia Network</span>
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Active Users</span>
                <span className="text-white font-mono">2</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Posts Today</span>
                <span className="text-white font-mono">7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">NFTs Minted</span>
                <span className="text-white font-mono">3</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/30">
            <h3 className="text-sm font-bold text-white mb-3">What's new features</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                <div className="text-xs text-gray-400">💎</div>
                <div className="text-sm text-white">Mint Profile NFT</div>
              </button>
              <button className="w-full text-left p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                <div className="text-xs text-gray-400">🎨</div>
                <div className="text-sm text-white">Create Post NFT</div>
              </button>
              <button className="w-full text-left p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                <div className="text-xs text-gray-400">✔️</div>
                <div className="text-sm text-white">Get Verified</div>
              </button>
              <button className="w-full text-left p-2 rounded-lg hover:bg-slate-700/50 transition-colors">
                <div className="text-xs text-gray-400">⚡</div>
                <div className="text-sm text-white">Gasless Mode</div>
              </button>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/30">
            <h3 className="text-sm font-bold text-white mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-gray-300">New post minted as NFT</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Profile picture updated</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-gray-300">Profile picture updated</span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-300">Blue mark verified</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm rounded-2xl p-4 border border-purple-700/30">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
            <Megaphone className="w-6 h-6" />
              <span>Get good ROI advertising on SomniaShare</span>
            </h3>
          </div>
        </div>

        <div className="flex-1 max-w-2xl px-4">
          {!hasProfile ? (
            <div className="p-8">
              <CreateProfile />
            </div>
          ) : (
            <>
              {currentView === 'home' && <MainInterface onNavigateToUser={navigateToUserProfile} onFollowChange={refreshProfileCard} />}
              {currentView === 'profile' && <Profile />}
              {currentView === 'user-profile' && viewingUserAddress && (
                <UserProfile 
                  targetAddress={viewingUserAddress} 
                  onBack={navigateBack}
                  onFollowChange={refreshProfileCard}
                />
              )}
              {currentView === 'marketplace' && <Marketplace onNavigateToUser={navigateToUserProfile} onFollowChange={refreshProfileCard} />}
              {currentView === 'advertisement' && <Advertisement />}
            </>
          )}
        </div>

        <div className="w-80 p-6 space-y-6">
          {hasProfile ? (
            <div className="bg-gray-900 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
              <div className="flex flex-col items-center text-center">
                <ProfilePicture 
                  profileId={profileId ? BigInt(Number(profileId)) : BigInt(0)} 
                  size="lg" 
                  className="mb-3"
                />
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-bold text-lg">
                    {String(username || 'Loading...')}
                  </h3>
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
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>Somnia Blockchain</span>
                </div>
                <div className="flex space-x-6 text-center">
                  <div>
                    <div className="font-bold">{userPostCount}</div>
                    <div className="text-gray-500 text-sm">Tweets</div>
                  </div>
                  <div>
                    <div className="font-bold flex items-center justify-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{isLoadingFollowStats ? '...' : followStats.followersCount}</span>
                    </div>
                    <div className="text-gray-500 text-sm">Followers</div>
                  </div>
                  <div>
                    <div className="font-bold flex items-center justify-center space-x-1">
                      <UserCheck className="w-4 h-4" />
                      <span>{isLoadingFollowStats ? '...' : followStats.followingCount}</span>
                    </div>
                    <div className="text-gray-500 text-sm">Following</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="bg-gray-900 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30 mb-6">
            <h3 className="text-xl font-bold mb-4">What's happening</h3>
            
            <div className="space-y-3">
              <div className="hover:bg-slate-800/50 rounded-lg p-3 cursor-pointer transition-colors">
                <div className="text-xs text-gray-500 mb-1">Technology · Trending</div>
                <div className="font-bold text-white text-sm">#Web3Social</div>
                <div className="text-xs text-gray-400">2.1K posts</div>
              </div>
              
              <div className="hover:bg-slate-800/50 rounded-lg p-3 cursor-pointer transition-colors">
                <div className="text-xs text-gray-500 mb-1">Blockchain · Trending</div>
                <div className="font-bold text-white text-sm">#SomniaChain</div>
                <div className="text-xs text-gray-400">1.8K posts</div>
              </div>
              
              <div className="hover:bg-slate-800/50 rounded-lg p-3 cursor-pointer transition-colors">
                <div className="text-xs text-gray-500 mb-1">NFTs · Trending</div>
                <div className="font-bold text-white text-sm">#PostNFTs</div>
                <div className="text-xs text-gray-400">945 posts</div>
              </div>
              
              <div className="hover:bg-slate-800/50 rounded-lg p-3 cursor-pointer transition-colors">
                <div className="text-xs text-gray-500 mb-1">DeFi · Trending</div>
                <div className="font-bold text-white text-sm">#DecentralizedSocial</div>
                <div className="text-xs text-gray-400">756 posts</div>
              </div>
            </div>
            
            <button className="text-blue-400 text-sm hover:underline mt-3">
              Show more
            </button>
          </div>

          <div className="bg-gray-900 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30 mb-6">
            <h3 className="text-xl font-bold mb-4">Who to follow</h3>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <div>
                  <div className="font-bold text-sm">OpenAI</div>
                  <div className="text-gray-500 text-xs">@OpenAI</div>
                </div>
              </div>
              <FollowButton 
                followerId={address || ''} 
                followingId="0x0000000000000000000000000000000000000001" 
                size="sm"
                variant="outline"
                onFollowChange={refreshProfileCard}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">V</span>
                </div>
                <div>
                  <div className="font-bold text-sm">Vitalik Buterin</div>
                  <div className="text-gray-500 text-xs">@VitalikButerin</div>
                </div>
              </div>
              <FollowButton 
                followerId={address || ''} 
                followingId="0x0000000000000000000000000000000000000004" 
                size="sm"
                variant="outline"
                onFollowChange={refreshProfileCard}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <div>
                  <div className="font-bold text-sm">Webbie Co.</div>
                  <div className="text-gray-500 text-xs">@webbieco</div>
                </div>
              </div>
              <FollowButton 
                followerId={address || ''} 
                followingId="0x0000000000000000000000000000000000000002" 
                size="sm"
                variant="outline"
                onFollowChange={refreshProfileCard}
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                  <span className="text-black font-bold text-sm">G</span>
                </div>
                <div>
                  <div className="font-bold text-sm">Google</div>
                  <div className="text-gray-500 text-xs">@Google</div>
                </div>
              </div>
              <FollowButton 
                followerId={address || ''} 
                followingId="0x0000000000000000000000000000000000000003" 
                size="sm"
                variant="outline"
                onFollowChange={refreshProfileCard}
              />
            </div>

            <button className="text-blue-400 text-sm hover:underline">
              SEE MORE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
