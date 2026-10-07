import { KINOPOISK_TOP_QUERY } from './kinopoisk-top-query.mjs'

const ENDPOINT = 'https://graphql.kinopoisk.ru/graphql/?operationName=MovieDesktopListPage'
const MAX_BYTES = 1024 * 1024
const LISTS = { movie: 'top250', series: 'series-top250' }
const COMBINED_TYPES = new Set(['all', 'anime'])

export function resolveKinopoiskTop(url) {
  if (url.pathname !== '/api/kinopoisk/top') return null
  const type = url.searchParams.get('type') || 'movie'
  const page = url.searchParams.get('page') || '1'
  const limit = url.searchParams.get('limit') || '36'
  if (
    (!Object.hasOwn(LISTS, type) && !COMBINED_TYPES.has(type)) ||
    !/^[1-9]\d{0,2}$/.test(page) ||
    !/^[1-9]\d?$/.test(limit) ||
    Number(limit) > 50 ||
    (COMBINED_TYPES.has(type) && Number(limit) % 2 !== 0) ||
    (Number(page) - 1) *
      (COMBINED_TYPES.has(type) ? Number(limit) / 2 : Number(limit)) >=
      250
  ) {
    return { error: 'Invalid top parameters', status: 400 }
  }
  return {
    kind: 'top',
    path: url.pathname,
    params: { type, page, limit },
    cacheTtl: 3600
  }
}

export async function requestKinopoiskTop(resource, fetchImpl = fetch, timeoutMs = 15000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const { type, page, limit } = resource.params
    const isCombined = COMBINED_TYPES.has(type)
    const sourceTypes = isCombined ? ['movie', 'series'] : [type]
    const perListLimit = isCombined ? Number(limit) / 2 : Number(limit)
    const perListOffset = (Number(page) - 1) * perListLimit
    const filters =
      type === 'anime'
        ? {
            booleanFilterValues: [],
            intRangeFilterValues: [],
            singleSelectFilterValues: [{ filterId: 'genre', value: 'anime' }],
            multiSelectFilterValues: [],
            realRangeFilterValues: []
          }
        : null

    const lists = await Promise.all(
      sourceTypes.map(async (sourceType) => {
        const response = await fetchImpl(ENDPOINT, {
          method: 'POST',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            'service-id': '25',
            Origin: 'https://www.kinopoisk.ru',
            Referer: 'https://www.kinopoisk.ru/',
            'x-preferred-language': 'ru'
          },
          body: JSON.stringify({
            operationName: 'MovieDesktopListPage',
            query: KINOPOISK_TOP_QUERY,
            variables: {
              slug: LISTS[sourceType],
              platform: 'DESKTOP',
              withUserData: false,
              supportedFilterTypes: filters ? ['SINGLE_SELECT'] : [],
              filters,
              singleSelectFiltersLimit: 50,
              singleSelectFiltersOffset: 0,
              moviesLimit: perListLimit,
              moviesOffset: perListOffset
            }
          })
        })
        if (!response.ok) throw new Error('Kinopoisk upstream HTTP ' + response.status)
        if (!response.body) throw new Error('Empty Kinopoisk response')

        const reader = response.body.getReader()
        const chunks = []
        let size = 0
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            size += value.length
            if (size > MAX_BYTES) throw new Error('Kinopoisk response too large')
            chunks.push(value)
          }
        } finally {
          await reader.cancel().catch(() => {})
        }

        const bytes = new Uint8Array(size)
        let offset = 0
        for (const chunk of chunks) {
          bytes.set(chunk, offset)
          offset += chunk.length
        }
        const data = JSON.parse(new TextDecoder().decode(bytes))
        const list = data?.data?.movieListBySlug
        const items = list?.movies?.items
        if (
          data.errors?.length ||
          !Array.isArray(items) ||
          !Number.isInteger(list?.movies?.total) ||
          list.movies.total < 1 ||
          list.movies.total > 250 ||
          items.length > perListLimit ||
          items.some((item) => !Number.isInteger(item?.movie?.id) || item.movie.id < 1)
        ) {
          throw new Error('Invalid Kinopoisk top response')
        }
        return list
      })
    )

    const items = []
    const maxListLength = Math.max(...lists.map((list) => list.movies.items.length))
    for (let index = 0; index < maxListLength; index += 1) {
      for (const list of lists) {
        const item = list.movies.items[index]
        if (item) items.push(item)
      }
    }

    const pageItems = items.slice(0, Number(limit))
    const pageOffset = (Number(page) - 1) * Number(limit)
    const normalizedItems = pageItems.map(({ movie }, index) => ({
        position: pageOffset + index + 1,
        movie: {
          id: movie.id,
          type: movie.__typename,
          title: movie.title,
          gallery: { posterUrl: movie.gallery?.posters?.vertical?.avatarsUrl },
          rating: { kinopoisk: movie.rating?.kinopoisk },
          year: movie.productionYear || movie.releaseYears?.start,
          duration: movie.duration,
          countries: movie.countries,
          genres: movie.genres
        }
      }))

    return {
      data: {
        total: lists.reduce((total, list) => total + list.movies.total, 0),
        name: type === 'anime' ? 'Аниме' : isCombined ? 'Все' : lists[0].name,
        items: normalizedItems
      },
      source: 'kinopoisk'
    }
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Kinopoisk upstream timeout')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export async function serveKinopoiskTop(resource, url, headers, ctx, cache) {
  delete headers['X-Search-Transport']
  delete headers['X-Kinobox-Transport']
  headers['X-Data-Source'] = 'kinopoisk'
  const cacheUrl = new URL('/__kinopoisk-top-cache', url.origin)
  cacheUrl.searchParams.set('version', headers['X-Worker-Version'])
  for (const [key, value] of Object.entries(resource.params)) {
    cacheUrl.searchParams.set(key, value)
  }
  const cached = await cache.match(cacheUrl.toString())
  if (cached) {
    headers['X-Top-Cache'] = 'HIT'
    return new Response(cached.body, { headers })
  }
  try {
    const data = await requestKinopoiskTop(resource)
    const body = JSON.stringify(data)
    ctx.waitUntil(
      cache
        .put(
          cacheUrl.toString(),
          new Response(body, {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=' + resource.cacheTtl
            }
          })
        )
        .catch(() => console.error('kinopoisk_top_cache_error'))
    )
    headers['X-Top-Cache'] = 'MISS'
    console.log(
      JSON.stringify({
        event: 'kinopoisk_top',
        type: resource.params.type,
        count: data.data.items.length
      })
    )
    return new Response(body, { headers })
  } catch (error) {
    const timeout = /timeout/i.test(error.message)
    console.error(JSON.stringify({ event: 'kinopoisk_top_error', message: error.message }))
    return new Response(
      JSON.stringify({ error: timeout ? 'Upstream timeout' : 'Kinopoisk top unavailable' }),
      { status: timeout ? 504 : 502, headers }
    )
  }
}
