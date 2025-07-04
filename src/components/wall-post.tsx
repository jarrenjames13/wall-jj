"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect, useRef } from "react"
import { Post, fetchPosts, createPost, deletePost, subscribeToNewPosts } from "@/lib/utils"
import { ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from "@/lib/supabase"
import { ImageIcon, X, Trash2, Upload } from "lucide-react"
import Image from "next/image"

export function WallPost() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newPost, setNewPost] = useState("")
  const [uploaderName, setUploaderName] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Load posts on mount
  useEffect(() => {
    const loadPosts = async () => {
      const fetchedPosts = await fetchPosts()
      setPosts(fetchedPosts)
    }
    loadPosts()
  }, [])

  // Subscribe to new posts
  useEffect(() => {
    const unsubscribe = subscribeToNewPosts((newPost) => {
      setPosts(prevPosts => [newPost, ...prevPosts])
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Cleanup preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFile = (file: File) => {
    // Validate file type
    const isValidType = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(file.type)
    if (!isValidType) {
      setError("Unsupported file type. Please upload an image or video.")
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large (max 50MB)")
      return
    }

    // Create preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const newPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(newPreviewUrl)
    setSelectedFile(file)
    setError("")
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    handleFile(file)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === dropZoneRef.current) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return
    handleFile(file)
  }

  const clearSelectedFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async () => {
    if (!newPost.trim() && !selectedFile) {
      setError("Please write something or attach a file before sharing")
      return
    }
    if (newPost.length > 280) {
      setError("Message is too long (maximum 280 characters)")
      return
    }
    if (!uploaderName.trim()) {
      setError("Please enter your name")
      return
    }

    setIsSubmitting(true)
    try {
      await createPost(newPost.trim(), uploaderName.trim(), selectedFile || undefined)
      // The real-time subscription will handle adding the post to the state
      setNewPost("")
      clearSelectedFile()
      setError("")
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An error occurred while creating the post. Please try again.")
      }
      console.error('Error creating post:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (postId: string) => {
    try {
      await deletePost(postId)
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId))
    } catch (err) {
      console.error('Error deleting post:', err)
      setError("Failed to delete post. Please try again.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleSubmit()
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div 
          ref={dropZoneRef}
          className={`border-2 ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-dashed border-gray-300'} rounded-lg p-4 transition-colors`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <Input
            type="text"
            placeholder="Your name"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            className="mb-2"
            maxLength={50}
            disabled={isSubmitting}
          />
          <textarea
            className="w-full p-2 border-none focus:outline-none resize-none bg-transparent"
            placeholder="What's on your mind?"
            rows={3}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={280}
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(',')}
                onChange={handleFileSelect}
                disabled={isSubmitting}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                disabled={isSubmitting}
                title="Upload media"
              >
                <ImageIcon className="w-5 h-5 text-blue-500" />
              </button>
              {!selectedFile && (
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  Drag and drop files here
                </div>
              )}
            </div>
            <p className="text-gray-500 text-sm">
              {newPost.length}/280
            </p>
          </div>
          {previewUrl && (
            <div className="relative mt-4 group">
              {selectedFile?.type.startsWith('image/') ? (
                <div className="relative w-full max-h-48 aspect-video">
                  <Image 
                    src={previewUrl}
                    alt="Preview"
                    fill
                    className="rounded-lg object-contain"
                  />
                </div>
              ) : (
                <video 
                  src={previewUrl}
                  className="rounded-lg max-h-48 w-auto"
                  controls
                />
              )}
              <button
                onClick={clearSelectedFile}
                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                title="Remove media"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <div className="flex justify-end">
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white px-8"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sharing...' : 'Share'}
          </Button>
        </div>
      </div>

      {posts.map((post) => (
        <Card key={post.id} className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold">{post.uploaderName}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDelete(post.id)}
              title="Delete post"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-gray-700">{post.body}</p>
          {post.mediaUrl && (
            <div className="mt-4">
              {post.mediaType === 'image' ? (
                <div className="relative w-full max-h-96 aspect-video">
                  <Image 
                    src={post.mediaUrl}
                    alt="Post image"
                    fill
                    className="rounded-lg object-contain"
                  />
                </div>
              ) : post.mediaType === 'video' ? (
                <video 
                  src={post.mediaUrl}
                  controls 
                  className="rounded-lg max-h-96 w-auto"
                />
              ) : null}
            </div>
          )}
          <p className="text-gray-500 text-sm mt-2">
            {new Date(post.timestamp).toLocaleString()}
          </p>
        </Card>
      ))}
    </div>
  )
}