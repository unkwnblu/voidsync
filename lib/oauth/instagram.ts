/** Instagram OAuth helpers (uses Facebook Graph API) */

const APP_ID = process.env.INSTAGRAM_APP_ID!
const APP_SECRET = process.env.INSTAGRAM_APP_SECRET!
const CALLBACK_URL = process.env.INSTAGRAM_CALLBACK_URL!

export function getInstagramAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: CALLBACK_URL,
    scope:
      'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
    state,
    response_type: 'code',
  })
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`
}

export async function exchangeInstagramCode(code: string): Promise<{
  access_token: string
  expires_in?: number
}> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: APP_ID,
        client_secret: APP_SECRET,
        redirect_uri: CALLBACK_URL,
        code,
      })
  )
  if (!res.ok) throw new Error(`Instagram token exchange failed: ${await res.text()}`)
  return res.json()
}

/** Get the Instagram Business Account linked to a Facebook Page */
export async function getInstagramAccount(
  pageId: string,
  pageAccessToken: string
): Promise<{ id: string; name: string; profile_picture_url: string } | null> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account{id,name,profile_picture_url}&access_token=${pageAccessToken}`
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.instagram_business_account ?? null
}
