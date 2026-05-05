import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchSeoMovies, updateSeoDataFile } from './fetch-seo-data.js'

describe('fetch-seo-data', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws when the API request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failed')))

    await expect(
      updateSeoDataFile({
        apiBaseUrl: 'https://example.invalid',
        pageCount: 1
      })
    ).rejects.toThrow('Network failed')
  })

  it('returns fetched entries without persisting a file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ kp_id: '123', title: 'Interstellar', name_original: 'Interstellar' }]
        })
      })
    )

    const result = await fetchSeoMovies({ apiBaseUrl: 'https://example.com', pageCount: 1 })
    expect(result).toHaveLength(1)
    expect(result[0].kp_id).toBe('123')
  })
})
