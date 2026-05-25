import { createClient } from '@/lib/supabase/server'
import ScheduledPostList from '@/components/ScheduledPostList'
import PostComposer from '@/components/PostComposer'

export default async function SchedulerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('platform')
    .eq('user_id', user!.id)
    .eq('is_active', true)

  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('user_id', user!.id)
    .order('scheduled_at', { ascending: true })

  const connectedPlatforms = [...new Set(accounts?.map((a) => a.platform) ?? [])]

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-white">
        Scheduler
      </h1>

      <div className="mb-8">
        <PostComposer connectedPlatforms={connectedPlatforms} userId={user!.id} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        All scheduled posts
      </h2>

      <ScheduledPostList posts={posts ?? []} />
    </div>
  )
}
