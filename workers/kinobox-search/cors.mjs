const ALLOWED_ORIGINS = new Set([
  'https://kamiqb.gitlab.io',
  'https://akaiho.github.io',
  'https://akaiho.vercel.app',
  'http://127.0.0.1:5173',
  'http://localhost:5173'
])

const AKAIHO_VERCEL_PREVIEW = /^akaiho-[a-z0-9-]+-akaiho\.vercel\.app$/i

export const isAllowedOrigin = (origin) => {
  if (ALLOWED_ORIGINS.has(origin)) return true

  try {
    const parsed = new URL(origin)
    return (
      parsed.origin === origin &&
      parsed.protocol === 'https:' &&
      AKAIHO_VERCEL_PREVIEW.test(parsed.hostname)
    )
  } catch {
    return false
  }
}