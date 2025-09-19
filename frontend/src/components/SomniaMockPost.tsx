import { useState } from 'react'
import { BadgeCheck } from 'lucide-react'

interface SomniaMockPostProps {
  bannerUrl?: string
  avatarUrl?: string
}

export default function SomniaMockPost({
  bannerUrl = '/somnia-banner.jpg',
  avatarUrl = '/somnia-avatar.png',
}: SomniaMockPostProps) {
  const [bannerFailed, setBannerFailed] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm p-6 rounded-2xl border border-slate-700/30 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white to-purple-500 flex items-center justify-center">
            {!avatarFailed ? (
              <img
                src={avatarUrl}
                onError={() => setAvatarFailed(true)}
                alt="Somnia"
                className="w-full h-full object-cover p-1"
              />
            ) : (
              <span className="text-white font-bold">S</span>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-white">Somnia Network</span>
              <BadgeCheck
        className="
          h-6 w-6
          text-white
          fill-blue-500
          stroke-white
        "
      />
              <span className="text-sm text-gray-400">@somnia</span>
            </div>
            <span className="text-sm text-gray-500">Official announcement</span>
          </div>
        </div>
      </div>

      {/* Banner */}
      <div className="rounded-xl overflow-hidden border border-slate-700/30 mb-4">
        {!bannerFailed ? (
          <img
            src={bannerUrl}
            onError={() => setBannerFailed(true)}
            alt="Somnia announcement"
            className="w-full h-56 object-cover"
          />
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600" />
        )}
      </div>

      {/* Content */}
      <div className="mb-2">
        <p className="text-white leading-relaxed">
        Dive into the future of decentralized social with Somnia. Mint your profile, post on-chain, and trade Post NFTs—all in one seamless experience.
        </p>
      </div>

      {/* Non-interactive footer note */}
      <div className="pt-3 border-t border-slate-700/30 text-xs text-gray-400">
        Sponsored announcement · Non-interactive
      </div>
    </div>
  )
}


