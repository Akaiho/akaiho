import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { createSitemapUrls, generateSeoAssets } from './generate-seo-assets.js'

describe('generate-seo-assets', () => {
  it('generates static routes', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'seo-assets-'))
    const robotsPath = path.join(tempDir, 'robots.txt')
    const sitemapPath = path.join(tempDir, 'sitemap.xml')

    const { urls } = await generateSeoAssets({
      robotsPath,
      sitemapPath,
      siteOrigin: 'https://example.com',
      basePath: '/app'
    })

    expect(urls.map((item) => item.loc)).toEqual([
      'https://example.com/app/',
      'https://example.com/app/top',
      'https://example.com/app/contact'
    ])
  })

  it('returns only static routes in sitemap URLs', () => {
    const urls = createSitemapUrls({
      siteOrigin: 'https://example.com',
      basePath: '/app',
      currentDate: '2026-03-17'
    })

    expect(urls.map((item) => item.loc)).toEqual([
      'https://example.com/app/',
      'https://example.com/app/top',
      'https://example.com/app/contact'
    ])
  })
})
