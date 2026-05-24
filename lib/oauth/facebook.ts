/** Facebook OAuth helpers */

const APP_ID = process.env.FACEBOOK_APP_ID!
const APP_SECRET = process.env.FACEBOOK_APP_SECRET!
const CALLBACK_URL = process.env.FACEBOOK_CALLBACK_URL!

export function getFacebookAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'pages_manage_posts,pages_read_engagement,pages_show_list',
    state,
    response_type: 'code',
  })
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`
}

export async function exchangeFacebookCode(code: string): Promise<{
  access_token: string
  token_type: string
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
  if (!res.ok) throw new Error(`Facebook token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function getFacebookPages(userAccessToken: string) {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${userAccessToken}`
  )
  if (!res.ok) throw new Error(`Failed to fetch FB pages: ${await res.text()}`)
  const data = await res.json()
  return data.data as Array<{
    id: string
    name: string
    access_token: string
  }>
}
