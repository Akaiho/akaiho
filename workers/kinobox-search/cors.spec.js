import { describe, expect, it } from 'vitest'
import { isAllowedOrigin } from './cors.mjs'

describe('Akaiho Worker CORS origins', () => {
  it('allows configured production and local origins', () => {
    expect(isAllowedOrigin('https://kamiqb.gitlab.io')).toBe(true)
    expect(isAllowedOrigin('https://akaiho.github.io')).toBe(true)
    expect(isAllowedOrigin('https://akaiho.vercel.app')).toBe(true)
    expect(isAllowedOrigin('http://localhost:5173')).toBe(true)
    expect(isAllowedOrigin('http://127.0.0.1:5173')).toBe(true)
  })

  it('allows only Akaiho Vercel preview deployments', () => {
    expect(isAllowedOrigin('https://akaiho-htulif7ha-akaiho.vercel.app')).toBe(true)
    expect(isAllowedOrigin('https://akaiho-preview-123-akaiho.vercel.app')).toBe(true)
    expect(isAllowedOrigin('https://other-project-123-akaiho.vercel.app')).toBe(false)
    expect(isAllowedOrigin('http://akaiho-htulif7ha-akaiho.vercel.app')).toBe(false)
    expect(isAllowedOrigin('https://akaiho-123-akaiho.vercel.app.evil.test')).toBe(false)
  })

  it('rejects missing, malformed and unrelated origins', () => {
    expect(isAllowedOrigin(null)).toBe(false)
    expect(isAllowedOrigin('not-an-origin')).toBe(false)
    expect(isAllowedOrigin('https://example.com')).toBe(false)
  })
})