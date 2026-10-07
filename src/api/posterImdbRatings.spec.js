import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getPosterImdbRatingMock } = vi.hoisted(() => ({
  getPosterImdbRatingMock: vi.fn()
}))

vi.mock('@/api/movies', () => ({ getPosterImdbRating: getPosterImdbRatingMock }))

import { getPosterImdbRating } from '@/api/posterImdbRatings'

describe('poster IMDb rating loader', () => {
  beforeEach(() => {
    getPosterImdbRatingMock.mockReset()
  })

  it('deduplicates concurrent detail requests for the same movie', async () => {
    getPosterImdbRatingMock.mockResolvedValue(8.7)

    const ratings = await Promise.all([
      getPosterImdbRating('poster-rating-dedupe'),
      getPosterImdbRating('poster-rating-dedupe')
    ])

    expect(ratings).toEqual([8.7, 8.7])
    expect(getPosterImdbRatingMock).toHaveBeenCalledOnce()
  })

  it('limits concurrent Kinobox detail requests', async () => {
    let activeRequests = 0
    let maximumActiveRequests = 0
    getPosterImdbRatingMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          activeRequests += 1
          maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests)
          setTimeout(() => {
            activeRequests -= 1
            resolve(7.5)
          }, 0)
        })
    )

    const ratings = await Promise.all(
      Array.from({ length: 10 }, (_, index) => getPosterImdbRating(`poster-rating-${index}`))
    )

    expect(maximumActiveRequests).toBe(4)
    expect(ratings).toEqual(Array(10).fill(7.5))
  })
})