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
    mediaType: post.media_type
  }))
}

export async function createPost(body: string, file?: File): Promise<Post | null> {
  try {
    let mediaUrl: string | undefined
    let mediaType: 'image' | 'video' | undefined

    if (file) {
      mediaUrl = await uploadMedia(file)
      mediaType = file.type.startsWith('image/') ? 'image' : 'video'
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([
        {
          body,
          media_url: mediaUrl,
          media_type: mediaType
        }
      ])
      .select()
      .single()

    if (error) throw error

    return {
      id: data.id,
      body: data.body,
      timestamp: data.created_at,
      mediaUrl: data.media_url,
      mediaType: data.media_type
    }
  } catch (error) {
    console.error('Error creating post:', error)
    return null
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
          mediaType: payload.new.media_type
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
  const timestamp = new Date().getTime()
  const fileExt = file.name.split('.').pop()
  const fileName = `${timestamp}.${fileExt}`

  const { error } = await supabase.storage
    .from('media')
    .upload(fileName, file)

  if (error) {
    throw error
  }

  const { data: { publicUrl } } = supabase.storage
    .from('media')
    .getPublicUrl(fileName)

  return publicUrl
}
