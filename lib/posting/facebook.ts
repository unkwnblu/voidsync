import axios from 'axios'

interface FacebookPostOptions {
  content: string
  pageId: string
  pageToken: string
  mediaUrls?: string[] | null
}

interface FacebookPostResult {
  success: boolean
  postId?: string
  error?: string
}

export async function postToFacebook({
  content,
  pageId,
  pageToken,
  mediaUrls,
}: FacebookPostOptions): Promise<FacebookPostResult> {
  try {
    let postId: string

    if (mediaUrls && mediaUrls.length > 0) {
      // Upload photos then create a multi-photo post
      const attachedMedia: { media_fbid: string }[] = []

      for (const url of mediaUrls) {
        const photoRes = await axios.post(
          `https://graph.facebook.com/v19.0/${pageId}/photos`,
          { url, published: false, access_token: pageToken }
        )
        attachedMedia.push({ media_fbid: photoRes.data.id })
      }

      const feedRes = await axios.post(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        {
          message: content,
          attached_media: attachedMedia,
          access_token: pageToken,
        }
      )
      postId = feedRes.data.id
    } else {
      const feedRes = await axios.post(
        `https://graph.facebook.com/v19.0/${pageId}/feed`,
        { message: content, access_token: pageToken }
      )
      postId = feedRes.data.id
    }

    return { success: true, postId }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
