import { describe, expect, it, vi } from 'vitest'

vi.mock('vite-ssg', () => ({
  ViteSSG: vi.fn(() => ({}))
}))

vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn()
}))

vi.mock('./store/theme', () => ({
  useThemeStore: () => ({
    initTheme: vi.fn()
  })
}))

vi.mock('./composables/useAppSetup', () => ({
  useAppSetup: vi.fn()
}))

vi.mock('./router/routes', () => ({
  routes: []
}))

vi.mock('./router', () => ({
  installRouterGuards: vi.fn()
}))

vi.mock('./App.vue', () => ({
  default: {}
}))

describe('main includedRoutes', () => {
  it('returns only static paths', async () => {
    const { includedRoutes } = await import('./main.js')
    const result = await includedRoutes(['/', '/top', '/movie/:kp_id/:slug'])

    expect(result).toEqual(['/', '/top'])
  })
})
