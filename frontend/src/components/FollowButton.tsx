import { useFollow } from '../hooks/useFollow'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'

interface FollowButtonProps {
  followerId: string
  followingId: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
  className?: string
  onFollowChange?: () => void
}

const sizeClasses = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
}

const variantClasses = {
  default: 'bg-blue-600 hover:bg-blue-700 text-white',
  outline: 'bg-transparent border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white hover:border-slate-500',
  ghost: 'text-slate-400 hover:text-white hover:bg-slate-700/50'
}

export default function FollowButton({ 
  followerId, 
  followingId, 
  size = 'md',
  variant = 'default',
  className = '',
  onFollowChange
}: FollowButtonProps) {
  const { isFollowing, isLoading, isToggling, toggleFollow } = useFollow(followerId, followingId, onFollowChange)

  if (isLoading) {
    return (
      <button
        disabled
        className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full font-medium transition-colors duration-200 flex items-center space-x-2 opacity-50 cursor-not-allowed ${className}`}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading...</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggleFollow}
      disabled={isToggling || followerId === followingId}
      className={`${sizeClasses[size]} ${variantClasses[variant]} rounded-full font-medium transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isToggling ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <UserMinus className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span>
        {isToggling 
          ? (isFollowing ? 'Unfollowing...' : 'Following...') 
          : (isFollowing ? 'Unfollow' : 'Follow')
        }
      </span>
    </button>
  )
}
