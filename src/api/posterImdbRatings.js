import { getPosterImdbRating as fetchPosterImdbRating } from '@/api/movies'

const MAX_CONCURRENT_LOOKUPS = 4
const ratingPromises = new Map()
const pendingLookups = []
let activeLookups = 0

const startPendingLookups = () => {
  while (activeLookups < MAX_CONCURRENT_LOOKUPS && pendingLookups.length > 0) {
    const lookup = pendingLookups.shift()
    activeLookups += 1

    fetchPosterImdbRating(lookup.kpId)
      .then((rating) => rating ?? null)
      .catch(() => null)
      .then((rating) => {
        activeLookups -= 1
        if (rating === null) ratingPromises.delete(lookup.kpId)
        lookup.resolve(rating)
        startPendingLookups()
      })
  }
}

export const getPosterImdbRating = (kpId) => {
  const normalizedKpId = String(kpId || '').trim()
  if (!normalizedKpId) return Promise.resolve(null)

  const cachedPromise = ratingPromises.get(normalizedKpId)
  if (cachedPromise) return cachedPromise

  const ratingPromise = new Promise((resolve) => {
    pendingLookups.push({ kpId: normalizedKpId, resolve })
  })
  ratingPromises.set(normalizedKpId, ratingPromise)
  startPendingLookups()

  return ratingPromise
}