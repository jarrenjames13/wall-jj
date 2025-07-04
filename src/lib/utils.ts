import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "./supabase"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type Post = {
  id: string
  body: string
  timestamp: string
  mediaUrl?: string
  mediaType?: 'image' | 'video'
  uploaderName: string
}

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data.map(post => ({
    id: post.id,
    body: post.body,
    timestamp: post.created_at,
    mediaUrl: post.media_url,
    mediaType: post.media_type,
    uploaderName: post.uploader_name || 'Anonymous'
  }))
}

export async function createPost(body: string, uploaderName: string, file?: File): Promise<Post | null> {
  try {
    let mediaUrl: string | undefined
    let mediaType: 'image' | 'video' | undefined

    if (file) {
      try {
        mediaUrl = await uploadMedia(file)
        mediaType = file.type.startsWith('image/') ? 'image' : 'video'
      } catch (uploadError) {
        console.error('Error uploading media:', uploadError)
        throw uploadError
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          body,
          media_url: mediaUrl,
          media_type: mediaType,
          created_at: new Date().toISOString(),
          uploader_name: uploaderName
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error inserting post:', error)
      throw error
    }

    if (!data) {
      throw new Error('No data returned from post creation')
    }

    return {
      id: data.id,
      body: data.body,
      timestamp: data.created_at,
      mediaUrl: data.media_url,
      mediaType: data.media_type,
      uploaderName: data.uploader_name
    }
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

export async function deletePost(postId: string): Promise<void> {
  try {
    // First get the post to check if it has media
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('media_url')
      .eq('id', postId)
      .single()

    if (fetchError) {
      console.error('Error fetching post for deletion:', fetchError)
      throw fetchError
    }

    // If post has media, delete it from storage
    if (post?.media_url) {
      const mediaPath = new URL(post.media_url).pathname.split('/').pop()
      if (mediaPath) {
        const { error: storageError } = await supabase.storage
          .from('posts-media')
          .remove([mediaPath])

        if (storageError) {
          console.error('Error deleting media:', storageError)
          // Continue with post deletion even if media deletion fails
        }
      }
    }

    // Delete the post from the database
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)

    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      throw deleteError
    }
  } catch (error) {
    console.error('Error in deletePost:', error)
    throw error
  }
}

export function subscribeToNewPosts(callback: (post: Post) => void) {
  const subscription = supabase
    .channel('posts')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'posts'
      },
      (payload) => {
        const newPost = {
          id: payload.new.id,
          body: payload.new.body,
          timestamp: payload.new.created_at,
          mediaUrl: payload.new.media_url,
          mediaType: payload.new.media_type,
          uploaderName: payload.new.uploader_name || 'Anonymous'
        }
        callback(newPost)
      }
    )
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}

async function uploadMedia(file: File): Promise<string> {
  try {
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

    const { data: { publicUrl } } = supabase.storage
      .from('posts-media')
      .getPublicUrl(fileName)

    return publicUrl
  } catch (error) {
    console.error('Upload media error:', error)
    throw error
  }
}
