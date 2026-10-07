import { describe, expect, it, vi } from 'vitest'
import { fetchKinopoiskUnofficialImdbRating } from './kinopoisk-unofficial.mjs'

const jsonResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data
})

describe('Kinopoisk Unofficial IMDb lookup', () => {
  it('requests details by Kinopoisk ID with the API key header', async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ kinopoiskId: 456, ratingImdb: 8.2 }))

    await expect(fetchKinopoiskUnofficialImdbRating(456, 'secret-test-key', fetcher)).resolves.toBe(
      8.2
    )
    expect(fetcher).toHaveBeenCalledWith(
      'https://kinopoiskapiunofficial.tech/api/v2.2/films/456',
      expect.objectContaining({
        method: 'GET',
        redirect: 'manual',
        headers: expect.objectContaining({ 'X-API-KEY': 'secret-test-key' })
      })
    )
  })

  it('returns null when the key, rating, or upstream response is unavailable', async () => {
    const fetcher = vi.fn()
    await expect(fetchKinopoiskUnofficialImdbRating(456, '', fetcher)).resolves.toBe(null)
    expect(fetcher).not.toHaveBeenCalled()

    fetcher.mockResolvedValueOnce(jsonResponse({ ratingImdb: null }))
    await expect(fetchKinopoiskUnofficialImdbRating(456, 'key', fetcher)).resolves.toBe(null)

    fetcher.mockResolvedValueOnce(jsonResponse({}, 429))
    await expect(fetchKinopoiskUnofficialImdbRating(456, 'key', fetcher)).resolves.toBe(null)
  })

  it('rejects invalid IDs without contacting the upstream API', async () => {
    const fetcher = vi.fn()

    await expect(fetchKinopoiskUnofficialImdbRating('../456', 'key', fetcher)).resolves.toBe(null)
    expect(fetcher).not.toHaveBeenCalled()
  })
})