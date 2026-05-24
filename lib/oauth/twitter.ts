/** Twitter OAuth 2.0 (PKCE) helpers */

const CLIENT_ID = process.env.TWITTER_CLIENT_ID!
const CLIENT_SECRET = process.env.TWITTER_CLIENT_SECRET!
const CALLBACK_URL = process.env.TWITTER_CALLBACK_URL!

export function getTwitterAuthUrl(state: string, codeChallenge: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: CALLBACK_URL,
    scope: 'tweet.read tweet.write users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `https://twitter.com/i/oauth2/authorize?${params}`
}

export async function exchangeTwitterCode(
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
}> {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://api.twitter.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: CALLBACK_URL,
      code_verifier: codeVerifier,
    }),
  })
  if (!res.ok) throw new Error(`Twitter token exchange failed: ${await res.text()}`)
  return res.json()
}

export async function getTwitterUser(accessToken: string) {
  const res = await fetch(
    'https://api.twitter.com/2/users/me?user.fields=id,name,username,profile_image_url',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Failed to fetch Twitter user: ${await res.text()}`)
  return (await res.json()).data as {
    id: string
    name: string
    username: string
    profile_image_url: string
  }
}
