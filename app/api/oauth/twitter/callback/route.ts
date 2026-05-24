import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeTwitterCode, getTwitterUser } from '@/lib/oauth/twitter'

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

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Retrieve & validate PKCE challenge
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

  // Clean up
  await supabase.from('pkce_challenges').delete().eq('state', state)

  try {
    const tokens = await exchangeTwitterCode(code, challenge.code_verifier)
    const twitterUser = await getTwitterUser(tokens.access_token)

    await supabase.from('social_accounts').upsert({
      user_id: user.id,
      platform: 'twitter',
      account_name: twitterUser.username,
      account_id: twitterUser.id,
      profile_picture: twitterUser.profile_image_url,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null,
      is_active: true,
    }, { onConflict: 'user_id,platform,account_id' })

    return NextResponse.redirect(
      new URL('/dashboard/accounts?connected=twitter', request.url)
    )
  } catch (err: unknown) {
    console.error('Twitter OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/dashboard/accounts?error=twitter_failed', request.url)
    )
  }
}
