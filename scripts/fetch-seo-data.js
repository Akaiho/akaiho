import { pathToFileURL } from 'node:url'
import { resolveCanonicalMovieIdentity } from '../src/utils/movieSlug.js'

const API_BASE_URL = process.env.SEO_SOURCE_API_URL || 'https://kinobd.net'
const PAGE_SIZE = Number(process.env.SEO_PAGE_SIZE || 100)
const PAGE_COUNT = Number(process.env.SEO_PAGE_COUNT || 3)

export const fetchPage = async (page, apiBaseUrl = API_BASE_URL) => {
  const url = `${apiBaseUrl}/api/films/top?page=${page}&per_page=${PAGE_SIZE}`
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`SEO fetch failed for page ${page}: ${response.status}`)
  }

  const payload = await response.json()
  return Array.isArray(payload?.data) ? payload.data : []
}

export const mapMovie = (movie) => {
  const identity = resolveCanonicalMovieIdentity(movie)
  const kpId = identity.kpId
  const title = identity.localizedTitle || identity.originalTitle

  if (!kpId || !title) return null

  return {
    kp_id: String(kpId),
    slug: identity.slug,
    title,
    name_original: identity.originalTitle,
    year: String(movie?.year || movie?.year_start || ''),
    description: String(movie?.description || '').trim(),
    poster: String(movie?.best_poster || movie?.big_poster || movie?.small_poster || '').trim(),
    updatedAt: String(movie?.updated_at || '').trim()
  }
}

export const dedupeMovies = (movies) => {
  const unique = new Map()

  for (const movie of movies) {
    if (!movie) continue
    if (!unique.has(movie.kp_id)) unique.set(movie.kp_id, movie)
  }

  return Array.from(unique.values())
}

export const fetchSeoMovies = async ({
  apiBaseUrl = API_BASE_URL,
  pageCount = PAGE_COUNT
} = {}) => {
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, index) => fetchPage(index + 1, apiBaseUrl))
  )

  return dedupeMovies(pages.flat().map(mapMovie))
}

export const updateSeoDataFile = ({ apiBaseUrl = API_BASE_URL, pageCount = PAGE_COUNT } = {}) =>
  fetchSeoMovies({ apiBaseUrl, pageCount })

async function main() {
  const movies = await updateSeoDataFile()
  if (movies.length === 0) {
    console.warn(`SEO fetch returned 0 movies from ${API_BASE_URL}`)
  }

  console.log(`Fetched ${movies.length} SEO entries (not persisted)`)
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  main().catch((error) => {
    console.warn(`SEO fetch failed`)
    console.warn(error)
  })
}
