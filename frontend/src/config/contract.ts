import {abi as SocialCoreABI} from './SocialCore.json'
import {abi as PostNFTABI} from './PostNFT.json'
import {abi as AdvertisementABI} from './Advertisement.json'

export const CONTRACT_ADDRESS = '0xD7eF3CDe3C4326b4e18891442Bd64cf749919619' as const

export const POST_NFT_CONTRACT_ADDRESS = '0x853464e7e4425Cf3f15DAec7F149df03948EcF4f' as const

export const AD_CONTRACT_ADDRESS = '0x160403E1BA0b2A5490A4809388923e4B93238CE6' as const

export const SOCIAL_CORE_ABI = SocialCoreABI as any

export const POST_NFT_ABI = PostNFTABI as any

export const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: SOCIAL_CORE_ABI,
} as const

export const postNFTContractConfig = {
  address: POST_NFT_CONTRACT_ADDRESS,
  abi: POST_NFT_ABI,
} as const

export const adContractConfig = {
  address: AD_CONTRACT_ADDRESS,
  abi: AdvertisementABI,
} as const