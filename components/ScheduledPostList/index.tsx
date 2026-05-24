'use client'

import { format } from 'date-fns'
import { FiTwitter, FiFacebook, FiInstagram, FiClock, FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const platformIcons = {
  twitter: FiTwitter,
  facebook: FiFacebook,
  instagram: FiInstagram,

}

const statusConfig = {
  scheduled: { label: 'Scheduled', icon: FiClock, class: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  processing: { label: 'Processing', icon: FiLoader, class: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  published: { label: 'Published', icon: FiCheckCircle, class: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  failed: { label: 'Failed', icon: FiXCircle, class: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
}

interface ScheduledPost {
  id: string
  content: string
  platforms: string[]
  scheduled_at: string
  status: string
  results?: Record<string, { success: boolean; postId?: string; error?: string }> | null
}

interface ScheduledPostListProps {
  posts: ScheduledPost[]
}

export default function ScheduledPostList({ posts }: ScheduledPostListProps) {
  const router = useRouter()

  async function handleDelete(id: string) {
    if (!confirm('Delete this scheduled post?')) return
    const supabase = createClient()
    await supabase.from('scheduled_posts').delete().eq('id', id)
    router.refresh()
  }

  if (!posts.length) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 py-12 text-center dark:border-zinc-800">
        <p className="text-sm text-zinc-400">No scheduled posts yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => {
        const { label, icon: StatusIcon, class: statusClass } =
          statusConfig[post.status as keyof typeof statusConfig] ?? statusConfig.scheduled

        return (
          <div
            key={post.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="line-clamp-2 text-sm text-zinc-800 dark:text-zinc-200">
                  {post.content}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {post.platforms.map((p) => {
                    const Icon = platformIcons[p as keyof typeof platformIcons]
                    return Icon ? <Icon key={p} size={13} className="text-zinc-400" /> : null
                  })}
                  <span className="text-xs text-zinc-400">·</span>
                  <span className="text-xs text-zinc-500">
                    {format(new Date(post.scheduled_at), 'MMM d, yyyy · h:mm a')}
                  </span>
                </div>
              </div>

              <span className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusClass}`}>
                <StatusIcon size={11} />
                {label}
              </span>
            </div>

            {post.status === 'scheduled' && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-xs text-red-400 transition-colors hover:text-red-600"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
