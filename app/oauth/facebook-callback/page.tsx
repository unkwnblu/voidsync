import { redirect } from 'next/navigation'

export default async function FacebookCallbackPage({
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

  redirect(`/api/oauth/facebook/callback?${qs}`)
}
