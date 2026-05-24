/**
 * Twitter OAuth callback page.
 * Twitter redirects here after authorization. We forward to the API route handler.
 * The actual token exchange happens in /api/oauth/twitter/callback.
 */
import { redirect } from 'next/navigation'

export default async function TwitterCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; state?: string; error?: string }>
}) {
  const params = await searchParams

  if (params.error) {
    redirect(`/dashboard/accounts?error=${params.error}`)
  }

  const qs = new URLSearchParams()
  if (params.code) qs.set('code', params.code)
  if (params.state) qs.set('state', params.state)

  redirect(`/api/oauth/twitter/callback?${qs}`)
}
