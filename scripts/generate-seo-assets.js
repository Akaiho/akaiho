import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { normalizeBasePath } from '../src/utils/basePath.js'

const SITE_ORIGIN = process.env.VITE_SITE_ORIGIN || 'https://akaiho.github.io'
const SITE_BASE_PATH = process.env.VITE_BASE_URL || '/akaiho'
const ROBOTS_PATH = path.resolve(process.cwd(), 'public/robots.txt')
const SITEMAP_PATH = path.resolve(process.cwd(), 'public/sitemap.xml')
const STATIC_SITEMAP_PATHS = ['/', '/top', '/contact']

const BASE_PATH = normalizeBasePath(SITE_BASE_PATH)

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export const createSitemapUrls = ({
  siteOrigin = SITE_ORIGIN,
  basePath = BASE_PATH,
  staticPaths = STATIC_SITEMAP_PATHS,
  currentDate = new Date().toISOString().slice(0, 10)
} = {}) => {
  return [
    ...staticPaths.map((routePath) => ({
      loc: `${siteOrigin}${basePath}${routePath === '/' ? '/' : routePath}`,
      lastmod: currentDate
    }))
  ]
}

export const createSitemapXml = (urls = []) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (item) =>
        `  <url>\n    <loc>${escapeXml(item.loc)}</loc>\n    <lastmod>${escapeXml(item.lastmod)}</lastmod>\n  </url>`
    )
    .join('\n')}\n</urlset>\n`

export const createRobotsTxt = ({ siteOrigin = SITE_ORIGIN, basePath = BASE_PATH } = {}) =>
  `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}${basePath}/sitemap.xml\n`

export async function generateSeoAssets({
  robotsPath = ROBOTS_PATH,
  sitemapPath = SITEMAP_PATH,
  siteOrigin = SITE_ORIGIN,
  basePath = BASE_PATH
} = {}) {
  const lastmod = new Date().toISOString().slice(0, 10)
  const urls = createSitemapUrls({ siteOrigin, basePath, currentDate: lastmod })
  const sitemap = createSitemapXml(urls)
  const robots = createRobotsTxt({ siteOrigin, basePath })

  await fs.mkdir(path.dirname(path.resolve(sitemapPath)), { recursive: true })
  await fs.writeFile(path.resolve(sitemapPath), sitemap, 'utf8')
  await fs.writeFile(path.resolve(robotsPath), robots, 'utf8')

  return { urls, sitemap, robots }
}

async function main() {
  const { urls } = await generateSeoAssets()
  console.log(`Generated ${urls.length} sitemap URLs`)
}

const isDirectRun = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url

if (isDirectRun) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
