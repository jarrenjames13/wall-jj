import { createClient } from '@supabase/supabase-js'

// These env variables are required for the application to work
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey)

// File upload configuration
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm'
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

// Upload media file to Supabase storage
export const uploadMedia = async (file: File) => {
  try {
    // Now try to upload the file
    const timestamp = new Date().getTime()
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('posts-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      throw uploadError
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('posts-media')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Upload media error:', error)
    throw error
  }
} 