import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeInstagramCode, getInstagramAccount } from '@/lib/oauth/instagram'
import { getFacebookPages } from '@/lib/oauth/facebook'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/accounts?error=missing_params', request.url)
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const { data: challenge } = await supabase
    .from('pkce_challenges')
    .select('*')
    .eq('state', state)
    .eq('user_id', user.id)
    .single()

  if (!challenge) {
    return NextResponse.redirect(
      new URL('/dashboard/accounts?error=invalid_state', request.url)
    )
  }

  await supabase.from('pkce_challenges').delete().eq('state', state)

  try {
    const tokens = await exchangeInstagramCode(code)
    const pages = await getFacebookPages(tokens.access_token)

    for (const page of pages) {
      const igAccount = await getInstagramAccount(page.id, page.access_token)
      if (!igAccount) continue

      await supabase.from('social_accounts').upsert({
        user_id: user.id,
        platform: 'instagram',
        account_name: igAccount.name,
        account_id: igAccount.id,
        profile_picture: igAccount.profile_picture_url,
        page_id: page.id,
        instagram_account_id: igAccount.id,
        access_token: page.access_token,
        is_active: true,
      }, { onConflict: 'user_id,platform,account_id' })
    }

    return NextResponse.redirect(
      new URL('/dashboard/accounts?connected=instagram', request.url)
    )
  } catch (err: unknown) {
    console.error('Instagram OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/dashboard/accounts?error=instagram_failed', request.url)
    )
  }
}
