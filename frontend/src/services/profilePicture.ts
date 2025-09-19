import { supabase } from '../config/supabase'

export interface ProfilePictureUpload {
  profileId: string
  file: File
}

export interface ProfilePictureData {
  url: string
  profileId: string
}

export class ProfilePictureService {
  private static readonly BUCKET_NAME = 'profile-pictures'
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

  static async uploadProfilePicture({ profileId, file }: ProfilePictureUpload): Promise<string> {

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size must be less than 5MB')
    }
    
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('File must be JPEG, PNG, or WebP')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${profileId}-${Date.now()}.${fileExt}`
    const filePath = `profiles/${fileName}`

    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath)

    return urlData.publicUrl
  }

  static async getProfilePicture(profileId: string): Promise<string | null> {
    try {

      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(`profiles`, {
          search: profileId
        })

      if (error || !files || files.length === 0) {
        return null
      }

      const sortedFiles = files.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      
      const latestFile = sortedFiles[0]
      const filePath = `profiles/${latestFile.name}`

      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error fetching profile picture:', error)
      return null
    }
  }

  static async deleteProfilePicture(profileId: string): Promise<void> {
    try {
      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(`profiles`, {
          search: profileId
        })

      if (error || !files) {
        return
      }

      const filePaths = files.map(file => `profiles/${file.name}`)
      
      const { error: deleteError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove(filePaths)

      if (deleteError) {
        console.error('Error deleting profile picture:', deleteError)
      }
    } catch (error) {
      console.error('Error deleting profile picture:', error)
    }
  }
}
