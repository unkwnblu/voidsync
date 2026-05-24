import axios from 'axios'

interface TwitterPostOptions {
  content: string
  accessToken: string
  mediaUrls?: string[] | null
}

interface TwitterPostResult {
  success: boolean
  postId?: string
  error?: string
}

export async function postToTwitter({
  content,
  accessToken,
  mediaUrls,
}: TwitterPostOptions): Promise<TwitterPostResult> {
  try {
    // Upload media first if provided
    const mediaIds: string[] = []
    if (mediaUrls && mediaUrls.length > 0) {
      for (const url of mediaUrls) {
        const mediaResponse = await axios.post(
          'https://upload.twitter.com/1.1/media/upload.json',
          { media_url_encoded: url },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        )
        mediaIds.push(mediaResponse.data.media_id_string)
      }
    }

    const body: Record<string, unknown> = { text: content }
    if (mediaIds.length > 0) {
      body.media = { media_ids: mediaIds }
    }

    const response = await axios.post(
      'https://api.twitter.com/2/tweets',
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return { success: true, postId: response.data.data.id }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
