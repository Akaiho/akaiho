const API_BASE_URL = 'https://kinopoiskapiunofficial.tech/api/v2.2/films/'
const VALID_ID = /^[1-9]\d{0,11}$/

export async function fetchKinopoiskUnofficialImdbRating(
  kpId,
  apiKey,
  fetchImpl = fetch,
  timeoutMs = 8000
) {
  const id = String(kpId || '')
  if (!VALID_ID.test(id)) return null
  if (!apiKey) {
    console.warn(JSON.stringify({ event: 'kp_unofficial_imdb_key_missing' }))
    return null
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetchImpl(API_BASE_URL + id, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-API-KEY': apiKey
      }
    })
    if (!response.ok) {
      console.warn(
        JSON.stringify({ event: 'kp_unofficial_imdb_upstream_error', status: response.status })
      )
      return null
    }

    const data = await response.json()
    const rawRating = data?.ratingImdb
    if (rawRating === null || rawRating === undefined || rawRating === '') {
      console.warn(JSON.stringify({ event: 'kp_unofficial_imdb_missing_rating', status: 200 }))
      return null
    }
    const rating = Number(rawRating)
    if (Number.isFinite(rating) && rating >= 0 && rating <= 10) return rating
    console.warn(JSON.stringify({ event: 'kp_unofficial_imdb_invalid_rating', status: 200 }))
    return null
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: 'kp_unofficial_imdb_request_failed',
        error: controller.signal.aborted ? 'timeout' : error?.name || 'unknown'
      })
    )
    return null
  } finally {
    clearTimeout(timeout)
  }
}