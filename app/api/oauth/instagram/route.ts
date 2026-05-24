import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInstagramAuthUrl } from '@/lib/oauth/instagram'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.redirect(new URL('/login', request.url))

  const state = uuidv4()

  await supabase.from('pkce_challenges').insert({
    state,
    code_verifier: 'instagram_no_pkce',
    user_id: user.id,
  })

  return NextResponse.redirect(getInstagramAuthUrl(state))
}
