'use client'

import { useState, useRef } from 'react'
import { FiTwitter, FiFacebook, FiInstagram, FiImage, FiX, FiSend } from 'react-icons/fi'
import { createClient } from '@/lib/supabase/client'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

const PLATFORMS = [
  { id: 'twitter', label: 'X / Twitter', icon: FiTwitter, color: 'text-sky-500 border-sky-300 bg-sky-50' },
  { id: 'facebook', label: 'Facebook', icon: FiFacebook, color: 'text-blue-600 border-blue-300 bg-blue-50' },
  { id: 'instagram', label: 'Instagram', icon: FiInstagram, color: 'text-pink-500 border-pink-300 bg-pink-50' },
]

interface PostComposerProps {
  connectedPlatforms: string[]
  userId: string
}

export default function PostComposer({ connectedPlatforms, userId }: PostComposerProps) {
  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([])
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function togglePlatform(id: string) {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  function handleFiles(files: FileList | null) {
    if (!files) return
    const newFiles = Array.from(files).slice(0, 4 - mediaFiles.length)
    setMediaFiles((prev) => [...prev, ...newFiles])
    setMediaPreviews((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ])
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function uploadMedia(): Promise<string[]> {
    const supabase = createClient()
    const urls: string[] = []
    for (const file of mediaFiles) {
      const path = `${userId}/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from('post-media').upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('post-media').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !selectedPlatforms.length) return

    setIsPosting(true)
    setMessage(null)

    try {
      const mediaUrls = mediaFiles.length > 0 ? await uploadMedia() : []

      if (scheduledAt) {
        // Schedule the post
        const supabase = createClient()
        const { error } = await supabase.from('scheduled_posts').insert({
          content,
          platforms: selectedPlatforms,
          media_urls: mediaUrls,
          scheduled_at: scheduledAt.toISOString(),
          status: 'scheduled',
        })
        if (error) throw error
        setMessage({ type: 'success', text: `Scheduled for ${scheduledAt.toLocaleString()}` })
      } else {
        // Post immediately
        const res = await fetch('/api/posting/multi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content, platforms: selectedPlatforms, mediaUrls }),
        })
        const data = await res.json()
        const allFailed = Object.values(data.results ?? {}).every(
          (r: unknown) => !(r as { success: boolean }).success
        )
        setMessage({
          type: allFailed ? 'error' : 'success',
          text: allFailed ? 'All posts failed. Check your connected accounts.' : 'Posted successfully!',
        })
      }

      setContent('')
      setSelectedPlatforms([])
      setMediaFiles([])
      setMediaPreviews([])
      setScheduledAt(null)
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' })
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Compose a post
      </h2>

      {/* Platform selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {PLATFORMS.map(({ id, label, icon: Icon, color }) => {
          const connected = connectedPlatforms.includes(id)
          const selected = selectedPlatforms.includes(id)
          return (
            <button
              key={id}
              type="button"
              disabled={!connected}
              onClick={() => togglePlatform(id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                !connected
                  ? 'cursor-not-allowed border-zinc-200 text-zinc-300 dark:border-zinc-700 dark:text-zinc-600'
                  : selected
                  ? `${color} ring-2 ring-offset-1`
                  : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Text area */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={4}
        maxLength={2200}
        className="w-full resize-none rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:text-white dark:placeholder-zinc-500"
      />
      <p className="mt-1 text-right text-xs text-zinc-400">{content.length}/2200</p>

      {/* Media previews */}
      {mediaPreviews.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mediaPreviews.map((src, i) => (
            <div key={i} className="relative h-20 w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => removeMedia(i)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-white"
              >
                <FiX size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <FiImage size={14} />
          Add media
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex-1" />

        {/* Schedule date picker */}
        <DatePicker
          selected={scheduledAt}
          onChange={(date: Date | null) => setScheduledAt(date)}
          showTimeSelect
          dateFormat="Pp"
          minDate={new Date()}
          placeholderText="Schedule (optional)"
          className="w-44 rounded-lg border border-zinc-200 bg-transparent px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          popperPlacement="top-end"
        />

        <button
          type="submit"
          disabled={isPosting || !content.trim() || !selectedPlatforms.length}
          className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
        >
          <FiSend size={12} />
          {scheduledAt ? 'Schedule' : 'Post now'}
        </button>
      </div>

      {message && (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-xs font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
          }`}
        >
          {message.text}
        </p>
      )}
    </form>
  )
}
