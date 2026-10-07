import axios from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { client } = vi.hoisted(() => ({
  client: { get: vi.fn() }
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => client)
  }
}))

import { apiSearch, getPosterImdbRating, getTopMovies } from '@/api/movies.kinobox'

describe('movies.kinobox adapter', () => {
  beforeEach(() => {
    client.get.mockReset()
  })

  it('normalizes Kinobox search results', async () => {
    client.get.mockResolvedValue({
      data: {
        data: [
          {
            kinopoiskId: 123,
            title: { russian: 'Матрица', original: 'The Matrix' },
            year: 1999,
            gallery: { posterUrl: 'https://example.com/poster.jpg' },
            type: 'movie'
          }
        ]
      }
    })

    const results = await apiSearch('матрица')

    expect(axios.create).toHaveBeenCalledTimes(1)
    expect(client.get).toHaveBeenCalledWith('/api/movies/search/', expect.objectContaining({
      params: expect.objectContaining({ query: 'матрица' })
    }))
    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Матрица')
  })

  it('maps Kinobox top list response', async () => {
    client.get.mockResolvedValue({
      data: {
        data: {
          items: [
            {
              position: 1,
              movie: {
                id: 456,
                title: { russian: 'Побег из Шоушенка', original: 'The Shawshank Redemption' },
                year: 1994,
                gallery: { posterUrl: 'https://example.com/top.jpg' },
                type: 'movie'
              }
            }
          ]
        }
      }
    })

    const results = await getTopMovies({ typeFilter: 'movie', page: 1, limit: 36 })

    expect(client.get).toHaveBeenCalledWith('/api/kinopoisk/top', expect.objectContaining({
      params: expect.objectContaining({ type: 'movie', page: 1, limit: 36 })
    }))
    expect(results).toHaveLength(1)
    expect(results[0].position).toBe(1)
    expect(results[0].source).toBe('kinopoisk')
  })

  it('loads poster IMDb through the non-erroring rating endpoint', async () => {
    client.get.mockResolvedValue({ data: { rating_imdb: null } })

    const rating = await getPosterImdbRating('456')

    expect(client.get).toHaveBeenCalledWith(
      '/api/movies/456/imdb-rating',
      expect.objectContaining({ params: expect.objectContaining({ ts: expect.any(Number) }) })
    )
    expect(rating).toBe(null)
  })

  it('combines film and series pages for the all filter using legacy Worker types', async () => {
    client.get.mockImplementation((_path, { params }) => {
      if (params.type === 'all') {
        return Promise.reject({ response: { status: 400 } })
      }
      return Promise.resolve({
        data: {
          data: {
            items: [
              {
                position: 1,
                movie: {
                  id: params.type === 'series' ? 202 : 101,
                  title: { russian: params.type === 'series' ? 'Сериал' : 'Фильм' },
                  gallery: { posterUrl: '' },
                  type: params.type === 'series' ? 'TvSeries' : 'Film'
                }
              }
            ]
          }
        }
      })
    })

    const results = await getTopMovies({ typeFilter: 'all', page: 1, limit: 36 })

    expect(client.get).toHaveBeenCalledTimes(3)
    expect(client.get.mock.calls[0][1].params).toEqual({ type: 'all', page: 1, limit: 36 })
    expect(client.get.mock.calls.slice(1).map(([, config]) => config.params)).toEqual([
      { type: 'movie', page: 1, limit: 18 },
      { type: 'series', page: 1, limit: 18 }
    ])
    expect(results.map((movie) => movie.id)).toEqual([101, 202])
  })

  it('shows only items tagged as anime', async () => {
    client.get.mockImplementation((_path, { params }) => {
      if (params.type === 'anime') {
        return Promise.reject({ response: { status: 400 } })
      }
      const page = params.page
      const type = params.type
      return Promise.resolve({
        data: {
          data: {
            items: [
              {
                position: (page - 1) * 50 + 1,
                movie: {
                  id: type === 'series' ? 200 + page : 100 + page,
                  title: { russian: 'Аниме' },
                  gallery: { posterUrl: '' },
                  genres: [{ id: 1750, name: 'аниме' }],
                  type: type === 'series' ? 'TvSeries' : 'Film'
                }
              },
              {
                position: (page - 1) * 50 + 2,
                movie: {
                  id: type === 'series' ? 300 + page : 400 + page,
                  title: { russian: 'Не аниме' },
                  gallery: { posterUrl: '' },
                  genres: [{ id: 5, name: 'драма' }],
                  type: type === 'series' ? 'TvSeries' : 'Film'
                }
              }
            ]
          }
        }
      })
    })

    const results = await getTopMovies({ typeFilter: 'anime', page: 1, limit: 36 })

    expect(client.get).toHaveBeenCalledTimes(11)
    expect(client.get.mock.calls[0][1].params).toEqual({ type: 'anime', page: 1, limit: 36 })
    expect(client.get.mock.calls.slice(1).every(([, config]) => config.params.limit === 50)).toBe(
      true
    )
    expect(results).toHaveLength(10)
    expect(results.every((movie) => movie.raw_data.genres.some((genre) => genre.id === 1750))).toBe(
      true
    )
  })
  
    it.each(['all', 'anime'])('uses the %s endpoint when the Worker supports it', async (typeFilter) => {
      client.get.mockResolvedValue({ data: { data: { items: [] } } })
  
      await getTopMovies({ typeFilter, page: 1, limit: 36 })
  
      expect(client.get).toHaveBeenCalledOnce()
      expect(client.get).toHaveBeenCalledWith('/api/kinopoisk/top', expect.objectContaining({
        params: { type: typeFilter, page: 1, limit: 36 }
      }))
    })

})
