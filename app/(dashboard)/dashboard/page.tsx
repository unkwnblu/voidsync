import { createClient } from '@/lib/supabase/server'
import PostComposer from '@/components/PostComposer'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('platform')
    .eq('user_id', user!.id)
    .eq('is_active', true)

  const { data: recentPosts } = await supabase
    .from('scheduled_posts')
    .select('id, status, platforms, scheduled_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const connectedPlatforms = [...new Set(accounts?.map((a) => a.platform) ?? [])]

  const stats = {
    connected: accounts?.length ?? 0,
    published: recentPosts?.filter((p) => p.status === 'published').length ?? 0,
    scheduled: recentPosts?.filter((p) => p.status === 'scheduled').length ?? 0,
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">
        Dashboard
      </h1>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        {[
          { label: 'Connected accounts', value: stats.connected },
          { label: 'Published (recent)', value: stats.published },
          { label: 'Scheduled', value: stats.scheduled },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{value}</p>
            <p className="text-xs text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {connectedPlatforms.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
          <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            No social accounts connected yet.
          </p>
          <a
            href="/dashboard/accounts"
            className="mt-2 inline-block text-sm font-semibold text-zinc-900 underline dark:text-white"
          >
            Connect accounts →
          </a>
        </div>
      ) : (
        <PostComposer connectedPlatforms={connectedPlatforms} userId={user!.id} />
      )}
    </div>
  )
}
