import { useMainStore } from '@/store/main'
import { normalizeMovieListResponse } from '@/api/movieSeoNormalizer'
import { trackAnalyticsEvent } from '@/utils/analytics'

const CONTENT_PROVIDERS = {
  KINOBD: 'kinobd',
  KINOBOX: 'kinobox'
}

const KINOBD_SUPPORTED_METHODS = new Set([
  'apiSearch',
  'getKpInfo',
  'getMovies',
  'getDiscussedMovies',
  'getKpIDfromIMDB',
  'getRandomMovie'
])
const KINOBOX_SUPPORTED_METHODS = new Set(['getPlayers'])
const PLAYER_PROVIDER_TIMEOUT_MS = 15000

const providers = {
  kinobd: null,
  kinobox: null
}

const providerImporters = {
  kinobd: () => import('@/api/movies.kinobd'),
  kinobox: () => import('@/api/movies.kinobox')
}

const loadProvider = async (provider) => {
  if (!providers[provider]) {
    providers[provider] = providerImporters[provider]()
  }

  return providers[provider]
}

const getCurrentProvider = () => {
  try {
    const mainStore = useMainStore()
    return mainStore.contentApiProvider || CONTENT_PROVIDERS.KINOBOX
  } catch {
    return CONTENT_PROVIDERS.KINOBOX
  }
}

const getCurrentSearchProvider = () => {
  try {
    const mainStore = useMainStore()
    return mainStore.searchApiProvider || CONTENT_PROVIDERS.KINOBD
  } catch {
    return CONTENT_PROVIDERS.KINOBD
  }
}

const searchKinoBDPlayerCandidates = async (...args) =>
  (await loadProvider('kinobd')).searchPlayerCandidates(...args)
const getKinoBDPlayerDataByInid = async (...args) =>
  (await loadProvider('kinobd')).getPlayerDataByInid(...args)

const hasPlayers = (players) => {
  if (Array.isArray(players)) return players.length > 0
  if (!players || typeof players !== 'object') return false
  return Object.keys(players).length > 0
}

const createProviderTimeoutError = (provider) => {
  const error = new Error(`getPlayers timed out on ${provider}`)
  error.name = 'PlayerProviderTimeoutError'
  return error
}

const withProviderTimeout = async (promise, provider) => {
  let timeoutId = null

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(createProviderTimeoutError(provider)),
          PLAYER_PROVIDER_TIMEOUT_MS
        )
      })
    ])
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  }
}

const trackPlayerProviderAttempt = (eventName, params) => {
  trackAnalyticsEvent('player_provider_attempt', params)
  if (eventName) {
    trackAnalyticsEvent(eventName, params)
  }
}

const getPlayersWithFallback = async (...args) => {
  const provider = getCurrentProvider()
  const startedAt = Date.now()
  const [contentId] = args
  const order =
    provider === CONTENT_PROVIDERS.KINOBD
      ? [CONTENT_PROVIDERS.KINOBD, CONTENT_PROVIDERS.KINOBOX]
      : [CONTENT_PROVIDERS.KINOBOX, CONTENT_PROVIDERS.KINOBD]

  let lastError = null

  for (const currentProvider of order) {
    const attemptStartedAt = Date.now()

    try {
      const providerApi = await loadProvider(currentProvider)
      const players = await withProviderTimeout(providerApi.getPlayers(...args), currentProvider)

      if (hasPlayers(players)) {
        trackPlayerProviderAttempt(null, {
          status: 'success',
          kp_id: contentId,
          configured_source: provider,
          source: currentProvider,
          fallback_used: currentProvider !== provider,
          duration_ms: Date.now() - startedAt,
          attempt_duration_ms: Date.now() - attemptStartedAt
        })
        return players
      }

      trackPlayerProviderAttempt(null, {
        status: 'empty',
        kp_id: contentId,
        configured_source: provider,
        source: currentProvider,
        fallback_used: currentProvider !== provider,
        duration_ms: Date.now() - startedAt,
        attempt_duration_ms: Date.now() - attemptStartedAt
      })
      console.warn(`[movies] getPlayers returned no players on ${currentProvider}`)
    } catch (error) {
      lastError = error
      const isTimeout = error?.name === 'PlayerProviderTimeoutError'
      const attemptPayload = {
        status: isTimeout ? 'timeout' : 'error',
        kp_id: contentId,
        configured_source: provider,
        source: currentProvider,
        fallback_used: currentProvider !== provider,
        duration_ms: Date.now() - startedAt,
        attempt_duration_ms: Date.now() - attemptStartedAt
      }

      if (isTimeout) {
        attemptPayload.timeout_ms = PLAYER_PROVIDER_TIMEOUT_MS
      }

      trackPlayerProviderAttempt(
        isTimeout ? 'player_provider_timeout' : 'player_provider_error',
        attemptPayload
      )
      console.warn(`[movies] getPlayers failed on ${currentProvider}`, error)
    }
  }

  if (lastError) {
    console.warn('[movies] getPlayers fallback exhausted; returning empty players map', lastError)
  }

  return {}
}

const callWithProvider = async (methodName, ...args) => {
  const provider = getCurrentProvider()

  if (provider === CONTENT_PROVIDERS.KINOBOX && KINOBOX_SUPPORTED_METHODS.has(methodName)) {
    try {
      const kinobox = await loadProvider('kinobox')
      return await kinobox[methodName](...args)
    } catch (error) {
      console.warn(`[movies] ${methodName} failed on Kinobox, fallback to KinoBD`, error)
      if (KINOBD_SUPPORTED_METHODS.has(methodName)) {
        try {
          const kinobd = await loadProvider('kinobd')
          return await kinobd[methodName](...args)
        } catch (fallbackError) {
          console.warn(`[movies] ${methodName} failed on KinoBD`, fallbackError)
          throw fallbackError
        }
      }
      throw error
    }
  }

  if (provider === CONTENT_PROVIDERS.KINOBOX && KINOBD_SUPPORTED_METHODS.has(methodName)) {
    try {
      const kinobd = await loadProvider('kinobd')
      return await kinobd[methodName](...args)
    } catch (error) {
      console.warn(`[movies] ${methodName} failed on KinoBD (Kinobox mode)`, error)
      throw error
    }
  }

  if (provider === CONTENT_PROVIDERS.KINOBD && KINOBD_SUPPORTED_METHODS.has(methodName)) {
    try {
      const kinobd = await loadProvider('kinobd')
      return await kinobd[methodName](...args)
    } catch (error) {
      console.warn(`[movies] ${methodName} failed on KinoBD`, error)
      throw error
    }
  }

  throw new Error(`Method ${methodName} is not supported by any provider`)
}

const apiSearch = async (...args) => {
  const provider = getCurrentSearchProvider()

  if (provider === CONTENT_PROVIDERS.KINOBD) {
    try {
      const kinobd = await loadProvider('kinobd')
      return await normalizeMovieListResponse(await kinobd.apiSearch(...args))
    } catch (error) {
      console.warn('[movies] apiSearch failed on KinoBD', error)
      throw error
    }
  }

  throw new Error('No search provider available')
}
const getShikiInfo = async (...args) => callWithProvider('getShikiInfo', ...args)
const getKpInfo = async (...args) => callWithProvider('getKpInfo', ...args)
const getPlayers = async (...args) => getPlayersWithFallback(...args)
const getShikiPlayers = async (...args) => callWithProvider('getShikiPlayers', ...args)
const shouldEnrichListSeo = true
// Top lists come from KinoBD
const getMovies = async (...args) => {
  try {
    return await normalizeMovieListResponse(
      await (await loadProvider('kinobd')).getMovies(...args),
      {
        enrichMissingSeo: shouldEnrichListSeo
      }
    )
  } catch (error) {
    console.warn('[movies] getMovies failed on KinoBD', error)
    throw error
  }
}
const getDiscussedMovies = async (...args) =>
  await normalizeMovieListResponse(
    await (await loadProvider('kinobd')).getDiscussedMovies(...args),
    {
      enrichMissingSeo: shouldEnrichListSeo
    }
  )
const getDons = async () => {
  throw new Error('Function no longer supported')
}
const getKpIDfromIMDB = async (...args) => callWithProvider('getKpIDfromIMDB', ...args)
const getNudityInfoFromIMDB = async () => {
  throw new Error('Function no longer supported')
}
const getKpIDfromSHIKI = async () => {
  throw new Error('Function no longer supported')
}
const getComments = async () => {
  throw new Error('Function no longer supported')
}
const createComment = async () => {
  throw new Error('Function no longer supported')
}
const updateComment = async () => {
  throw new Error('Function no longer supported')
}
const deleteComment = async () => {
  throw new Error('Function no longer supported')
}
const rateComment = async () => {
  throw new Error('Function no longer supported')
}
const getRandomMovie = async (...args) => callWithProvider('getRandomMovie', ...args)
const getTwitchStream = async () => {
  throw new Error('Function no longer supported')
}
const getMovieNote = async () => {
  throw new Error('Function no longer supported')
}
const saveMovieNote = async () => {
  throw new Error('Function no longer supported')
}
const deleteMovieNote = async () => {
  throw new Error('Function no longer supported')
}

export {
  searchKinoBDPlayerCandidates,
  getKinoBDPlayerDataByInid,
  apiSearch,
  getShikiInfo,
  getKpInfo,
  getPlayers,
  getShikiPlayers,
  getMovies,
  getDiscussedMovies,
  getDons,
  getKpIDfromIMDB,
  getKpIDfromSHIKI,
  getNudityInfoFromIMDB,
  getComments,
  createComment,
  updateComment,
  deleteComment,
  rateComment,
  getRandomMovie,
  getTwitchStream,
  getMovieNote,
  saveMovieNote,
  deleteMovieNote
}

export const toggleErrorSimulation = (enabled) => {
  return Promise.all([loadProvider('kinobd'), loadProvider('kinobox')]).then(
    ([kinobd, kinobox]) => {
      if (typeof kinobd.toggleErrorSimulation === 'function') {
        kinobd.toggleErrorSimulation(enabled)
      }
      if (typeof kinobox.toggleErrorSimulation === 'function') {
        kinobox.toggleErrorSimulation(enabled)
      }
    }
  )
}
