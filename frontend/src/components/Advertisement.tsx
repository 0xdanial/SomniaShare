import { useState, useEffect, useMemo } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi'
import { adContractConfig } from '../config/contract'
import { Megaphone, Clock, CheckCircle, XCircle, AlertCircle, Star } from 'lucide-react'

interface UserAd {
  adId: number
  content: string
  status: string
  submittedAt: number
}

export default function Advertisement() {
  const { address } = useAccount()
  const [adContent, setAdContent] = useState('')
  const [isSubmittingAd, setIsSubmittingAd] = useState(false)

  const { data: adCounter, refetch: refetchAdCounter } = useReadContract({
    ...adContractConfig,
    functionName: 'adCounter',
  })

  const { data: adFee } = useReadContract({
    ...adContractConfig,
    functionName: 'AD_FEE',
  })

  const adIdsToQuery = useMemo(() => {
    if (!adCounter) return [] as bigint[]
    const n = Number(adCounter)
    if (!Number.isFinite(n) || n <= 0) return [] as bigint[]
    const ids: bigint[] = []
    for (let i = 1; i <= n; i++) ids.push(BigInt(i))
    return ids
  }, [adCounter])

  const adsBatch = useReadContracts({
    allowFailure: true,
    contracts: adIdsToQuery.map((id) => ({
      ...adContractConfig,
      functionName: 'ads',
      args: [id],
    })) as any,
    query: {
      enabled: adIdsToQuery.length > 0,
    },
  })

  const adStatesBatch = useReadContracts({
    allowFailure: true,
    contracts: adIdsToQuery.map((id) => ({
      ...adContractConfig,
      functionName: 'getAdState',
      args: [id],
    })) as any,
    query: {
      enabled: adIdsToQuery.length > 0,
    },
  })

  const userAds = useMemo((): UserAd[] => {
    if (!adsBatch?.data || !adStatesBatch?.data || !address) return []
    
    const result: UserAd[] = []
    
    adsBatch.data.forEach((adRes, idx) => {
      if (adRes && adRes.status === 'success' && adRes.result) {
        const [owner, content, acceptedAt] = adRes.result as [string, string, bigint, number]
        const adStateRes = adStatesBatch.data[idx]
        
        if (owner.toLowerCase() === address.toLowerCase() && adStateRes && adStateRes.status === 'success') {
          result.push({
            adId: Number(adIdsToQuery[idx]),
            content,
            status: adStateRes.result as string,
            submittedAt: Number(acceptedAt),
          })
        }
      }
    })
    
    return result.sort((a, b) => b.adId - a.adId)
  }, [adsBatch?.data, adStatesBatch?.data, address, adIdsToQuery])

  const { writeContract: writeSubmitAd, data: submitAdHash } = useWriteContract()

  const { isLoading: isSubmittingAdTx, isSuccess: isAdSubmitted } = useWaitForTransactionReceipt({
    hash: submitAdHash,
  })

  useEffect(() => {
    if (isAdSubmitted) {
      refetchAdCounter()
      adsBatch.refetch()
      adStatesBatch.refetch()
    }
  }, [isAdSubmitted])

  const handleSubmitAd = async () => {
    if (!adContent.trim() || !adFee) return

    setIsSubmittingAd(true)
    try {
      writeSubmitAd({
        ...adContractConfig,
        functionName: 'submitAd',
        args: [adContent.trim()],
        value: adFee as bigint,
      })
      setAdContent('')
    } catch (err) {
      console.error('Error submitting ad:', err)
    } finally {
      setIsSubmittingAd(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-400 bg-green-900/20 border-green-700/30'
      case 'Pending':
        return 'text-yellow-400 bg-yellow-900/20 border-yellow-700/30'
      case 'Rejected':
        return 'text-red-400 bg-red-900/20 border-red-700/30'
      case 'Expired':
        return 'text-gray-400 bg-gray-900/20 border-gray-700/30'
      default:
        return 'text-gray-400 bg-gray-900/20 border-gray-700/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="w-4 h-4" />
      case 'Pending':
        return <Clock className="w-4 h-4" />
      case 'Rejected':
        return <XCircle className="w-4 h-4" />
      case 'Expired':
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mt-6 bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-slate-700/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Advertisement Center</h1>
            <p className="text-gray-400">Submit and manage your advertisements on SomniaShare</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Active Campaigns</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Megaphone className="w-6 h-6 text-blue-400" />
            <span>Submit New Advertisement</span>
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Advertisement Content
              </label>
              <textarea
                value={adContent}
                onChange={(e) => setAdContent(e.target.value)}
                placeholder="Enter your advertisement content here..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-gray-400 resize-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <p>Fee: {adFee ? Number(adFee as bigint) / 1e18 : 0} STT</p>
                <p>Duration: 24 hours (if approved)</p>
              </div>
              
              <button
                onClick={handleSubmitAd}
                disabled={!adContent.trim() || isSubmittingAd || isSubmittingAdTx || !adFee}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed px-6 py-3 rounded-full font-semibold text-white transition-colors duration-200 flex items-center space-x-2"
              >
                <Megaphone className="w-4 h-4" />
                <span>{isSubmittingAd || isSubmittingAdTx ? 'Submitting...' : 'Submit Advertisement'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/30">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
            <Star className="w-6 h-6 text-yellow-400" />
            <span>Your Advertisements</span>
          </h2>
          
          {userAds.length > 0 ? (
            <div className="space-y-4">
              {userAds.map((ad) => (
                <div key={ad.adId} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Megaphone className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-400 font-semibold">Ad #{ad.adId}</span>
                      </div>
                    </div>
                    
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(ad.status)}`}>
                      {getStatusIcon(ad.status)}
                      <span>{ad.status}</span>
                    </div>
                  </div>
                  
                  <div className="bg-slate-600/50 rounded-lg p-3">
                    <p className="text-white text-sm leading-relaxed">{ad.content}</p>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-400 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Submitted: {new Date(ad.submittedAt * 1000).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/30">
                <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Megaphone className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-white">Ready to Advertise?</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                  Reach thousands of users on SomniaShare with your advertisements. Your ads will appear in the main feed and help grow your audience.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-2xl mb-2">📢</div>
                    <h4 className="font-semibold text-white text-sm">24h Duration</h4>
                    <p className="text-gray-400 text-xs">Your ad runs for 24 hours</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-2xl mb-2">👥</div>
                    <h4 className="font-semibold text-white text-sm">Wide Reach</h4>
                    <p className="text-gray-400 text-xs">Visible to all users</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <div className="text-2xl mb-2">✅</div>
                    <h4 className="font-semibold text-white text-sm">Easy Approval</h4>
                    <p className="text-gray-400 text-xs">Quick review process</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Submit your first ad above to get started!
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
