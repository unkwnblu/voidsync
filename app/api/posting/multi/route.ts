import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postToTwitter } from '@/lib/posting/twitter'
import { postToFacebook } from '@/lib/posting/facebook'
import { postToInstagram } from '@/lib/posting/instagram'


export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { content, platforms, mediaUrls } = body as {
    content: string
    platforms: string[]
    mediaUrls?: string[]
  }

  if (!content || !platforms?.length) {
    return NextResponse.json({ error: 'Missing content or platforms' }, { status: 400 })
  }

  const results: Record<string, unknown> = {}

  for (const platform of platforms) {
    try {
      const { data: account } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', platform)
        .eq('is_active', true)
        .single()

      if (!account) {
        results[platform] = { success: false, error: 'No connected account found' }
        continue
      }

      if (platform === 'twitter') {
        results.twitter = await postToTwitter({
          content,
          accessToken: account.access_token,
          mediaUrls,
        })
      } else if (platform === 'facebook') {
        results.facebook = await postToFacebook({
          content,
          pageId: account.page_id,
          pageToken: account.access_token,
          mediaUrls,
        })
      } else if (platform === 'instagram') {
        results.instagram = await postToInstagram({
          content,
          pageAccessToken: account.access_token,
          instagramAccountId: account.instagram_account_id,
          mediaUrls,
        })
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      results[platform] = { success: false, error: message }
    }
  }

  return NextResponse.json({ results })
}
