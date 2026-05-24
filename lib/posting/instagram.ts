import axios from 'axios'

interface InstagramPostOptions {
  content: string
  pageAccessToken: string
  instagramAccountId: string
  mediaUrls?: string[] | null
}

interface InstagramPostResult {
  success: boolean
  postId?: string
  error?: string
}

export async function postToInstagram({
  content,
  pageAccessToken,
  instagramAccountId,
  mediaUrls,
}: InstagramPostOptions): Promise<InstagramPostResult> {
  try {
    let containerId: string

    if (mediaUrls && mediaUrls.length > 1) {
      // Carousel post
      const itemIds: string[] = []
      for (const url of mediaUrls) {
        const itemRes = await axios.post(
          `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
          {
            image_url: url,
            is_carousel_item: true,
            access_token: pageAccessToken,
          }
        )
        itemIds.push(itemRes.data.id)
      }

      const carouselRes = await axios.post(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
        {
          media_type: 'CAROUSEL',
          caption: content,
          children: itemIds.join(','),
          access_token: pageAccessToken,
        }
      )
      containerId = carouselRes.data.id
    } else if (mediaUrls && mediaUrls.length === 1) {
      // Single image post
      const mediaRes = await axios.post(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
        {
          image_url: mediaUrls[0],
          caption: content,
          access_token: pageAccessToken,
        }
      )
      containerId = mediaRes.data.id
    } else {
      // Text-only (requires image on Instagram — this will fail without one)
      const mediaRes = await axios.post(
        `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
        { caption: content, access_token: pageAccessToken }
      )
      containerId = mediaRes.data.id
    }

    // Publish the container
    const publishRes = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
      { creation_id: containerId, access_token: pageAccessToken }
    )

    return { success: true, postId: publishRes.data.id }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
