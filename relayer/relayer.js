require('dotenv').config()
const express = require('express')
const { createPublicClient, createWalletClient, http, defineChain } = require('viem')
const { privateKeyToAccount } = require('viem/accounts')

const app = express()

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

app.use(express.json())

// ============================
// CONFIG
// ============================
const RPC_URL = process.env.RPC_URL || 'https://50312.rpc.thirdweb.com'
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY || ''
const FORWARDER_ADDRESS = process.env.FORWARDER_ADDRESS || '0x46EBEE7EB63906A4d732E29556bDf2B226966445'
const SOCIAL_CORE_ADDRESS = process.env.SOCIAL_CORE_ADDRESS || '0xD7eF3CDe3C4326b4e18891442Bd64cf749919619'

// Validate required environment variables
if (!RELAYER_PRIVATE_KEY) {
  console.error('❌ ERROR: RELAYER_PRIVATE_KEY environment variable is required!')
  console.error('   Please set RELAYER_PRIVATE_KEY in your .env file or environment')
  process.exit(1)
}

// Define Somnia Testnet chain
const somniaTestnet = defineChain({
  id: 50312,
  name: 'Somnia Testnet',
  network: 'somnia-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Somnia',
    symbol: 'STT'
  },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] }
  }
})

// Create clients
const publicClient = createPublicClient({
  chain: somniaTestnet,
  transport: http(RPC_URL)
})

const account = privateKeyToAccount(RELAYER_PRIVATE_KEY)
const walletClient = createWalletClient({
  account,
  chain: somniaTestnet,
  transport: http(RPC_URL)
})

console.log('🚀 Relayer Configuration:')
console.log(`   Relayer Address: ${account.address}`)
console.log(`   Forwarder: ${FORWARDER_ADDRESS}`)
console.log(`   SocialCore: ${SOCIAL_CORE_ADDRESS}`)
console.log(`   RPC: ${RPC_URL}`)
console.log('')
console.log('📝 Environment Variables Used:')
console.log(`   RELAYER_PRIVATE_KEY: ${RELAYER_PRIVATE_KEY ? '***SET***' : 'NOT SET'}`)
console.log(`   RPC_URL: ${RPC_URL}`)
console.log(`   FORWARDER_ADDRESS: ${FORWARDER_ADDRESS}`)
console.log(`   SOCIAL_CORE_ADDRESS: ${SOCIAL_CORE_ADDRESS}`)

// Forwarder ABI - Updated to match OpenZeppelin ERC2771Forwarder with error definitions
const FORWARDER_ABI = [
  {
    inputs: [
      {
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'gas', type: 'uint256' },
          { name: 'deadline', type: 'uint48' },
          { name: 'data', type: 'bytes' },
          { name: 'signature', type: 'bytes' }
        ],
        name: 'request',
        type: 'tuple'
      }
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'payable',
    type: 'function'
  },
  {
    inputs: [{ name: 'from', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: 'nonce', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Add error definitions for better error reporting
  {
    inputs: [
      { name: 'signer', type: 'address' },
      { name: 'from', type: 'address' }
    ],
    name: 'ERC2771ForwarderInvalidSigner',
    type: 'error'
  },
  {
    inputs: [
      { name: 'requestedValue', type: 'uint256' },
      { name: 'msgValue', type: 'uint256' }
    ],
    name: 'ERC2771ForwarderMismatchedValue',
    type: 'error'
  },
  {
    inputs: [{ name: 'deadline', type: 'uint48' }],
    name: 'ERC2771ForwarderExpiredRequest',
    type: 'error'
  },
  {
    inputs: [
      { name: 'target', type: 'address' },
      { name: 'forwarder', type: 'address' }
    ],
    name: 'ERC2771UntrustfulTarget',
    type: 'error'
  }
]

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Relayer is running',
    relayerAddress: account.address,
    forwarderAddress: FORWARDER_ADDRESS,
    socialCoreAddress: SOCIAL_CORE_ADDRESS,
    note: 'Update contract addresses after deployment'
  })
})

// Relay meta-transaction endpoint
app.post('/relay', async (req, res) => {
  try {
    const { request } = req.body

    // Ensure we have all required fields for OpenZeppelin ERC2771Forwarder
    if (!request.data || !request.signature) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Request must include data and signature fields' 
      })
    }

    const processedRequest = {
      from: request.from,
      to: request.to,
      value: BigInt(request.value),
      gas: BigInt(request.gas),
      deadline: BigInt(request.deadline),
      data: request.data,
      signature: request.signature
    }

    console.log('📨 Received meta-transaction request:', {
      from: processedRequest.from,
      to: processedRequest.to,
      value: processedRequest.value.toString(),
      gas: processedRequest.gas.toString(),
      deadline: processedRequest.deadline.toString(),
      dataLength: processedRequest.data.length,
      signatureLength: processedRequest.signature.length
    })

    // Check current nonce for debugging and validation
    let currentNonce
    try {
      currentNonce = await publicClient.readContract({
        address: FORWARDER_ADDRESS,
        abi: FORWARDER_ABI,
        functionName: 'nonces',
        args: [processedRequest.from]
      })
      console.log(`🔍 Current nonce for ${processedRequest.from}: ${currentNonce}`)
      
      // Important: The signature should have been created with this EXACT nonce
      // If nonces don't match, the signature will be invalid
      console.log(`⚠️  CRITICAL: Signature must have been created with nonce ${currentNonce}`)
      
    } catch (nonceError) {
      console.log('⚠️  Could not fetch nonce:', nonceError.message)
    }

    // Check if SocialCore trusts this forwarder
    try {
      const isTrustedForwarder = await publicClient.readContract({
        address: processedRequest.to,
        abi: [
          {
            inputs: [{ name: 'forwarder', type: 'address' }],
            name: 'isTrustedForwarder',
            outputs: [{ name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function'
          }
        ],
        functionName: 'isTrustedForwarder',
        args: [FORWARDER_ADDRESS]
      })
      console.log(`🔗 SocialCore trusts forwarder: ${isTrustedForwarder}`)
      
      if (!isTrustedForwarder) {
        return res.status(400).json({ 
          error: 'Forwarder not trusted', 
          message: 'SocialCore does not trust this forwarder address' 
        })
      }
    } catch (trustError) {
      console.log('⚠️  Could not check forwarder trust:', trustError.message)
    }

    // Verify the request is not expired
    const currentTime = Math.floor(Date.now() / 1000)
    if (Number(processedRequest.deadline) < currentTime) {
      return res.status(400).json({ error: 'Request expired' })
    }

    // Execute the meta-transaction (propagate errors if reverted)
    const hash = await walletClient.writeContract({
      address: FORWARDER_ADDRESS,
      abi: FORWARDER_ABI,
      functionName: 'execute',
      args: [processedRequest],
      value: processedRequest.value
    })

    console.log('✅ Meta-transaction executed:', hash)

    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    // Convert BigInt values to strings for JSON serialization
    const serializedReceipt = {
      ...receipt,
      blockNumber: receipt.blockNumber?.toString(),
      gasUsed: receipt.gasUsed?.toString(),
      cumulativeGasUsed: receipt.cumulativeGasUsed?.toString(),
      effectiveGasPrice: receipt.effectiveGasPrice?.toString(),
      logs: receipt.logs?.map(log => ({
        ...log,
        blockNumber: log.blockNumber?.toString(),
        logIndex: log.logIndex?.toString(),
        transactionIndex: log.transactionIndex?.toString()
      }))
    }

    res.json({
      success: true,
      hash,
      receipt: serializedReceipt
    })

  } catch (error) {
    console.error('❌ Error relaying transaction:', error)
    
    // Enhanced error reporting
    let errorDetails = {
      error: 'Failed to relay transaction',
      message: error.message
    }
    
    // Check if it's the specific InvalidSigner error
    if (error.message.includes('0xd6bda275')) {
      errorDetails.specificError = 'ERC2771ForwarderInvalidSigner'
      errorDetails.explanation = 'The signature verification failed. This usually means:'
      errorDetails.possibleCauses = [
        'Nonce mismatch (signature was created with wrong nonce)',
        'Domain separator mismatch',
        'Wrong signer address',
        'Signature format issue'
      ]
    }
    
    res.status(500).json(errorDetails)
  }
})

// Get nonce endpoint - CRITICAL: Always fetch fresh nonce
app.get('/nonce/:address', async (req, res) => {
  try {
    const { address } = req.params

    const nonce = await publicClient.readContract({
      address: FORWARDER_ADDRESS,
      abi: FORWARDER_ABI,
      functionName: 'nonces',
      args: [address]
    })

    console.log(`📊 Nonce requested for ${address}: ${nonce}`)
    res.json({ nonce: nonce.toString() })
  } catch (error) {
    console.error('Error getting nonce:', error)
    res.status(500).json({ error: 'Failed to get nonce', message: error.message })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`🌐 Relayer running on port ${PORT}`)
  console.log(`   Health check: http://localhost:${PORT}/health`)
  console.log(`   Relay endpoint: http://localhost:${PORT}/relay`)
  console.log('')
  console.log('⚠️  IMPORTANT: This is a test configuration!')
  console.log('   - Update contract addresses after deployment')
  console.log('   - Use a secure private key in production')
  console.log('   - Fund the relayer wallet with ETH for gas fees')
})
