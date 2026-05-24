import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postToTwitter } from '@/lib/posting/twitter'
import { postToFacebook } from '@/lib/posting/facebook'
import { postToInstagram } from '@/lib/posting/instagram'


export async function POST(request: NextRequest) {
  // Verify cron secret
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())

  if (!posts?.length) {
    return NextResponse.json({ processed: 0 })
  }

  for (const post of posts) {
    await supabase
      .from('scheduled_posts')
      .update({ status: 'processing' })
      .eq('id', post.id)

    const results: Record<string, unknown> = {}

    for (const platform of post.platforms as string[]) {
      try {
        const { data: account } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('user_id', post.user_id)
          .eq('platform', platform)
          .eq('is_active', true)
          .single()

        if (!account) throw new Error('No connected account found')

        if (platform === 'twitter') {
          results.twitter = await postToTwitter({
            content: post.content,
            accessToken: account.access_token,
            mediaUrls: post.media_urls,
          })
        } else if (platform === 'facebook') {
          results.facebook = await postToFacebook({
            content: post.content,
            pageId: account.page_id,
            pageToken: account.access_token,
            mediaUrls: post.media_urls,
          })
        } else if (platform === 'instagram') {
          results.instagram = await postToInstagram({
            content: post.content,
            pageAccessToken: account.access_token,
            instagramAccountId: account.instagram_account_id,
            mediaUrls: post.media_urls,
          })
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        results[platform] = { success: false, error: message }
      }
    }

    const allFailed = Object.values(results).every(
      (r) => !(r as { success: boolean }).success
    )

    await supabase
      .from('scheduled_posts')
      .update({
        status: allFailed ? 'failed' : 'published',
        results,
        updated_at: new Date().toISOString(),
      })
      .eq('id', post.id)
  }

  return NextResponse.json({ processed: posts.length })
}
