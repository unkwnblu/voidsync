import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeFacebookCode, getFacebookPages } from '@/lib/oauth/facebook'

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
    const tokens = await exchangeFacebookCode(code)
    const pages = await getFacebookPages(tokens.access_token)

    if (!pages.length) {
      return NextResponse.redirect(
        new URL('/dashboard/accounts?error=no_pages', request.url)
      )
    }

    // Store each page as a separate social account
    for (const page of pages) {
      await supabase.from('social_accounts').upsert({
        user_id: user.id,
        platform: 'facebook',
        account_name: page.name,
        account_id: page.id,
        page_id: page.id,
        page_name: page.name,
        access_token: page.access_token,
        is_active: true,
      }, { onConflict: 'user_id,platform,account_id' })
    }

    return NextResponse.redirect(
      new URL('/dashboard/accounts?connected=facebook', request.url)
    )
  } catch (err: unknown) {
    console.error('Facebook OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/dashboard/accounts?error=facebook_failed', request.url)
    )
  }
}
