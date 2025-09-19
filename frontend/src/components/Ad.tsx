import { Star } from 'lucide-react'

interface AdProps {
  adId: number
  content: string
}

export default function Ad({ adId, content }: AdProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className="flex items-center space-x-2">
        </div>
        <div className="flex items-center space-x-1 text-yellow-400 text-sm">
          <Star className="w-4 h-4" />
          <span>Sponsored</span>
        </div>
      </div>
      
      <div className="rounded-xl p-4 bg-gray-50 dark:bg-gray-800">
        <p className="text-gray-900 dark:text-white text-base leading-relaxed">{content}</p>
      </div>
      
      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        Ad #{adId} • This is a paid Ad
      </div>
    </div>
  )
}
