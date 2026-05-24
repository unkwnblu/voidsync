import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePkce } from '@/lib/oauth/pkce'
import { getTwitterAuthUrl } from '@/lib/oauth/twitter'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const state = uuidv4()
  const { codeVerifier, codeChallenge } = await generatePkce()

  // Store PKCE challenge
  await supabase.from('pkce_challenges').insert({
    state,
    code_verifier: codeVerifier,
    user_id: user.id,
  })

  const authUrl = getTwitterAuthUrl(state, codeChallenge)
  return NextResponse.redirect(authUrl)
}
