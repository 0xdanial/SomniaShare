import { useState } from 'react'
import { useAccount, useSignTypedData } from 'wagmi'
import { encodeFunctionData } from 'viem'
import { SOCIAL_CORE_ABI } from '../config/contract'

const FORWARDER_ADDRESS = '0x46EBEE7EB63906A4d732E29556bDf2B226966445' // forwarder address

const DOMAIN = {
  name: 'SocialForwarder',
  version: '1',
  chainId: 50312, // Somnia testnet
  verifyingContract: FORWARDER_ADDRESS as `0x${string}`
}

const TYPES = {
  ForwardRequest: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint48' },
    { name: 'data', type: 'bytes' }
  ]
} as const

export interface MetaTransactionRequest {
  from: `0x${string}`
  to: `0x${string}`
  value: bigint
  gas: bigint
  deadline: bigint
  data: `0x${string}`
  signature: `0x${string}`
}

export function useMetaTransaction() {
  const { address } = useAccount()
  const { signTypedDataAsync } = useSignTypedData()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMetaTransaction = async (
    targetContract: `0x${string}`,
    functionName: string,
    args: any[],
    value: bigint = 0n,
    gasLimit: bigint = 1000000n,
    abi: any = SOCIAL_CORE_ABI
  ) => {
    if (!address) {
      throw new Error('No wallet connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = encodeFunctionData({
        abi: abi,
        functionName,
        args
      }) as `0x${string}`

      console.log('🔄 Fetching fresh nonce for signing...')
      const nonce = await getNonce(address)

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)
      
      console.log('📝 Signing message with:', {
        from: address,
        to: targetContract,
        value: value.toString(),
        gas: gasLimit.toString(),
        nonce: nonce.toString(),
        deadline: Number(deadline),
        dataLength: data.length
      })
      
      const signature = await signTypedDataAsync({
        domain: DOMAIN,
        types: TYPES,
        primaryType: 'ForwardRequest',
        message: {
          from: address,
          to: targetContract,
          value,
          gas: gasLimit,
          nonce,
          deadline: Number(deadline),
          data: data
        }
      })
      
      console.log('✅ Signature generated:', signature)
      
      console.log('🔄 Verifying nonce consistency before sending...')
      const verifyNonce = await getNonce(address)
      if (verifyNonce !== nonce) {
        throw new Error(`Nonce changed during signing! Expected ${nonce}, got ${verifyNonce}. Please retry.`)
      }
      console.log('✅ Nonce consistency verified')

      const request: MetaTransactionRequest = {
        from: address,
        to: targetContract,
        value,
        gas: gasLimit,
        deadline: deadline,
        data,
        signature: signature as `0x${string}`
      }

      return { request, signature }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const getNonce = async (userAddress: `0x${string}`): Promise<bigint> => {
    const response = await fetch(`https://reuters-revolution-winter-ages.trycloudflare.com/nonce/${userAddress}`)
    if (!response.ok) throw new Error('Failed to get nonce')
    const { nonce } = await response.json()
    console.log(`📊 Fetched nonce for ${userAddress}: ${nonce}`)
    return BigInt(nonce)
  }

  return {
    createMetaTransaction,
    isLoading,
    error
  }
}

export async function sendMetaTransaction(
  request: MetaTransactionRequest,
  _signature: `0x${string}`,
  relayerUrl: string
) {

  const serializedRequest = {
    from: request.from,
    to: request.to,
    value: request.value.toString(),
    gas: request.gas.toString(),
    deadline: request.deadline.toString(),
    data: request.data,
    signature: request.signature
  }

  const response = await fetch(`${relayerUrl}/relay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ request: serializedRequest })
  })

  if (!response.ok) {
    throw new Error('Failed to relay transaction')
  }

  return response.json()
}
