import axios from 'axios'
import { getApi } from '@/api/axios'

let isErrorSimulationEnabled = false
const simulatedErrorCode = 500

const KINOBOX_BASE_URL = import.meta.env.VITE_KINOBOX_API_URL || 'https://api.kinobox.tv'
const KINOBOX_PROXY_PATH = import.meta.env.VITE_KINOBOX_PROXY_PATH || '/kinobox/players'
const KINOBOX_USE_PROXY =
  String(import.meta.env.VITE_KINOBOX_USE_PROXY || '').toLowerCase() === 'true'
const KINOBOX_PREFERRED_TYPE = String(import.meta.env.VITE_KINOBOX_PREFERRED_TYPE || '')
  .trim()
  .toLowerCase()
const KINOBOX_DISABLED_TYPES = (import.meta.env.VITE_KINOBOX_DISABLED_TYPES || 'aloha', 'flixcdn')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean)
const KINOBOX_BLOCKED_HOST_PATTERNS = (import.meta.env.VITE_KINOBOX_BLOCKED_HOSTS || 'stloadi.live')
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean)

const api = axios.create({
  baseURL: KINOBOX_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const simulateErrorIfNeeded = async () => {
  if (isErrorSimulationEnabled && simulatedErrorCode) {
    const status = parseInt(simulatedErrorCode, 10)
    const error = new Error(`Simulated error ${status}`)
    error.response = { status }
    throw error
  }
}

const apiCall = async (callFn) => {
  await simulateErrorIfNeeded()
  return await callFn(api)
}

const ensureUniqueKey = (obj, baseKey) => {
  if (!obj[baseKey]) return baseKey
  let idx = 2
  while (obj[`${baseKey} #${idx}`]) idx++
  return `${baseKey} #${idx}`
}

const normalizePlayerType = (value) => String(value || 'Player').trim()

const isBlockedPlayerIframe = (iframeUrl) => {
  if (!iframeUrl) return true

  try {
    const host = new URL(iframeUrl).hostname.toLowerCase()
    return KINOBOX_BLOCKED_HOST_PATTERNS.some(
      (pattern) => host === pattern || host.endsWith(`.${pattern}`)
    )
  } catch {
    return false
  }
}

const toPlayersMap = (providers = [], { type = null, translationId = null } = {}) => {
  const players = {}
  const selectedType = type ? String(type).toLowerCase() : null
  const selectedTranslationId =
    translationId === null || translationId === undefined ? null : String(translationId)

  for (const provider of providers) {
    const providerType = normalizePlayerType(provider?.type)
    const normalizedProviderType = providerType.toLowerCase()

    if (KINOBOX_DISABLED_TYPES.includes(normalizedProviderType)) {
      continue
    }

    if (selectedType && normalizedProviderType !== selectedType) {
      continue
    }

    const providerBaseIframe = provider?.iframeUrl || ''
    const providerLabel = `KINOBOX>${providerType}`

    if (providerBaseIframe && !isBlockedPlayerIframe(providerBaseIframe)) {
      const key = ensureUniqueKey(players, providerLabel)
      players[key] = {
        name: key,
        translate: providerType,
        iframe: providerBaseIframe,
        quality: '',
        warning: false,
        source: 'kinobox',
        raw_data: provider
      }
    }

    const translations = Array.isArray(provider?.translations) ? provider.translations : []
    for (const translation of translations) {
      const iframe = translation?.iframeUrl || ''
      if (!iframe) continue
      if (isBlockedPlayerIframe(iframe)) continue

      const tId =
        translation?.id === null || translation?.id === undefined ? null : String(translation.id)
      if (selectedTranslationId && tId !== selectedTranslationId) continue

      const translationName = String(translation?.name || 'Translation').trim()
      const key = ensureUniqueKey(players, `${providerLabel}>${translationName}`)
      players[key] = {
        name: key,
        translate: translationName,
        iframe,
        quality: translation?.quality || '',
        warning: false,
        source: 'kinobox',
        raw_data: translation,
        provider: providerType
      }
    }
  }

  return players
}

const getPlayersRaw = async (kpId, { title = '' } = {}) => {
  const normalizedKpId = String(kpId)

  // Browsers do not allow overriding Origin/Referer headers from JS.
  // We try backend proxy first (server-side headers), then fallback to direct request.
  if (KINOBOX_USE_PROXY) {
    const backendApi = await getApi()
    const response = await backendApi.get(`${KINOBOX_PROXY_PATH}/${normalizedKpId}`, {
      validateStatus: () => true,
      params: title ? { title: String(title) } : {}
    })

    if (response.status >= 200 && response.status < 300) {
      return Array.isArray(response.data?.data) ? response.data.data : []
    }

    if (response.status !== 404) {
      console.warn(
        `[movies.kinobox] proxy request failed with status ${response.status}, fallback to direct request`
      )
    }
  }

  const { data } = await apiCall((client) =>
    client.get('/api/players', {
      params: {
        kinopoisk: normalizedKpId,
        ...(title ? { title: String(title) } : {})
      }
    })
  )

  return Array.isArray(data?.data) ? data.data : []
}

const getPlayers = async (kpId, options = {}) => {
  const providers = await getPlayersRaw(kpId, options)
  const preferredType = options?.type
    ? String(options.type).toLowerCase()
    : KINOBOX_PREFERRED_TYPE || null

  let players = toPlayersMap(providers, {
    ...options,
    ...(preferredType ? { type: preferredType } : {})
  })

  if (!Object.keys(players).length && preferredType) {
    players = toPlayersMap(providers, options)
  }

  if (!Object.keys(players).length) {
    throw new Error('Kinobox returned no usable players')
  }

  return players
}

export { getPlayers, getPlayersRaw }

export const toggleErrorSimulation = (enabled) => {
  isErrorSimulationEnabled = enabled
}
