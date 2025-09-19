import { useState, useEffect } from 'react'
import { ProfilePictureService } from '../services/profilePicture'
import { Camera, Upload, X } from 'lucide-react'

interface ProfilePictureProps {
  profileId: string | bigint
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showUpload?: boolean
  onUpload?: (url: string) => void
  className?: string
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-20 h-20'
}

export default function ProfilePicture({ 
  profileId, 
  size = 'md', 
  showUpload = false, 
  onUpload,
  className = ''
}: ProfilePictureProps) {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const profileIdStr = profileId.toString()

  useEffect(() => {
    loadProfilePicture()
  }, [profileIdStr])

  const loadProfilePicture = async () => {
    try {
      setIsLoading(true)
      const url = await ProfilePictureService.getProfilePicture(profileIdStr)
      setProfilePictureUrl(url)
    } catch (error) {
      console.error('Error loading profile picture:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !profileIdStr) return

    try {
      setIsUploading(true)
      const url = await ProfilePictureService.uploadProfilePicture({
        profileId: profileIdStr,
        file: selectedFile
      })
      
      setProfilePictureUrl(url)
      setShowUploadModal(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      onUpload?.(url)
    } catch (error) {
      console.error('Error uploading profile picture:', error)
      alert('Failed to upload profile picture. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = async () => {
    try {
      await ProfilePictureService.deleteProfilePicture(profileIdStr)
      setProfilePictureUrl(null)
      onUpload?.('')
    } catch (error) {
      console.error('Error removing profile picture:', error)
    }
  }

  const getInitials = () => {
    return profileIdStr.slice(0, 2).toUpperCase()
  }

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} ${className} bg-slate-600 rounded-full flex items-center justify-center animate-pulse`}>
        <div className="w-1/2 h-1/2 bg-slate-500 rounded"></div>
      </div>
    )
  }

  return (
    <>
      <div className={`${sizeClasses[size]} ${className} relative group`}>
        {profilePictureUrl ? (
          <img
            src={profilePictureUrl}
            alt="Profile"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-white">
              {getInitials()}
            </span>
          </div>
        )}

        {showUpload && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowUploadModal(true)}
                className="p-1 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors duration-200"
              >
                <Camera className="w-3 h-3" />
              </button>
              {profilePictureUrl && (
                <button
                  onClick={handleRemove}
                  className="p-1 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors duration-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-2xl p-6 w-96 max-w-[90vw]">
            <h3 className="text-xl font-bold text-white mb-4">Upload Profile Picture</h3>
            
            <div className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="w-full text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                />
              </div>

              {previewUrl && (
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-full font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-full font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
