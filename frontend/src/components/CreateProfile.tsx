import { useState } from 'react'
import { useAccount } from 'wagmi'
import { useMetaTransaction, sendMetaTransaction } from '../hooks/useMetaTransaction'

export default function CreateProfile() {
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { address } = useAccount()
  const { createMetaTransaction, isLoading: isMetaTxLoading, error: metaTxError } = useMetaTransaction()

  const handleCreateProfile = async () => {
    if (!username.trim() || !address) return

    setIsLoading(true)
    setError(null)
    setTxHash(null)
    setIsSuccess(false)

    try {
      const { request, signature } = await createMetaTransaction(
        '0xD7eF3CDe3C4326b4e18891442Bd64cf749919619',
        'createProfile',
        [username.trim()],
        0n,
        3000000n
      )

      console.log('Meta-transaction created:', { request, signature })

      const relayerUrl = 'https://reuters-revolution-winter-ages.trycloudflare.com'
      const result = await sendMetaTransaction(request, signature, relayerUrl)

      setTxHash(result.hash)
      setIsSuccess(true)
      console.log('Transaction successful:', result)

    } catch (err) {
      console.error('Error creating profile:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-green-400 mb-2">Profile Created!</h2>
        <p className="text-green-300 mb-4">Your profile has been created successfully via meta-transaction!</p>
        {txHash && (
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-400 mb-2">Transaction Hash:</p>
            <p className="text-xs text-blue-400 break-all">{txHash}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-gray-900 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/30">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-white">Create Your Profile</h2>
          <p className="text-gray-400">Choose a username to get started on SomniaShare</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-lg placeholder-gray-400 transition-colors duration-200 text-white bg-slate-700/50 border border-slate-600/50"
            />
          </div>
          
          <button
            onClick={handleCreateProfile}
            disabled={!username.trim() || isLoading || isMetaTxLoading || !address}
            className="w-full px-6 py-4 rounded-full font-semibold text-lg text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
          >
            {isLoading || isMetaTxLoading ? 'Creating Profile (Meta-TX)...' : 'Create Profile (Gasless)'}
          </button>
          
          {!address && (
            <div className="rounded-xl p-4 text-center bg-yellow-900/20 border border-yellow-700/30">
              <p className="text-yellow-400">Please connect your wallet to create a profile</p>
            </div>
          )}
          
          {(error || metaTxError) && (
            <div className="rounded-xl p-4 text-center bg-red-900/20 border border-red-700/30">
              <p className="text-red-400">Error: {error || metaTxError}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
