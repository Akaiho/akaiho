import { beforeEach, describe, expect, it, vi } from 'vitest'

const providers = vi.hoisted(() => ({
  kinobox: {
    apiSearch: vi.fn(),
    getKpInfo: vi.fn(),
    getTopMovies: vi.fn()
  },
  kinobd: {
    apiSearch: vi.fn(),
    getKpInfo: vi.fn(),
    getMovies: vi.fn()
  }
}))

vi.mock('@/store/main', () => ({
  useMainStore: () => ({
    contentApiProvider: 'kinobd',
    searchApiProvider: 'kinobd'
  })
}))

vi.mock('@/utils/analytics', () => ({ trackAnalyticsEvent: vi.fn() }))
vi.mock('@/api/movieSeoNormalizer', () => ({
  normalizeMovieListResponse: async (movies) => movies
}))
vi.mock('@/api/movies.kinobox', () => providers.kinobox)
vi.mock('@/api/movies.kinobd', () => providers.kinobd)

import { apiSearch, getMovies } from '@/api/movies'

describe('movies source routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    providers.kinobox.apiSearch.mockResolvedValue([{ kp_id: '101' }])
    providers.kinobox.getKpInfo.mockResolvedValue({ kp_id: '326' })
    providers.kinobox.getTopMovies.mockResolvedValue([{ kp_id: '202' }])
  })

  it('uses Kinobox search even when KinoBD is selected', async () => {
    const results = await apiSearch('matrix')

    expect(providers.kinobox.apiSearch).toHaveBeenCalledWith('matrix')
    expect(providers.kinobd.apiSearch).not.toHaveBeenCalled()
    expect(results).toEqual([{ kp_id: '101' }])
  })

  it('uses Kinobox top lists even when KinoBD is selected', async () => {
    const options = { typeFilter: 'series', page: 1, limit: 36 }
    const results = await getMovies(options)

    expect(providers.kinobox.getTopMovies).toHaveBeenCalledWith(options)
    expect(providers.kinobd.getMovies).not.toHaveBeenCalled()
    expect(results).toEqual([{ kp_id: '202' }])
  })

  it('uses Kinobox for movie details even when KinoBD is selected', async () => {
    const result = await (await import('@/api/movies')).getKpInfo('326')

    expect(providers.kinobox.getKpInfo).toHaveBeenCalledWith('326')
    expect(providers.kinobd.getKpInfo).not.toHaveBeenCalled()
    expect(result).toEqual({ kp_id: '326' })
  })
})