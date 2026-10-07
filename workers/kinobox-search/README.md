# Akaiho Kinobox Worker

This Cloudflare Worker proxies Kinobox search, movie details and player sources
over HTTP/2. It also serves Kinopoisk popular film/series lists (up to 1000 each),
and an anime-only view filtered by Kinopoisk's `genre=anime` value.

## Requirements

- Node.js 20 or newer
- A Cloudflare account with Workers enabled
- `wrangler login` completed for that account

The Worker uses `workers_dev` and deploys to the logged-in account's
`akaiho-kinobox.<account-subdomain>.workers.dev` address. No account ID from
another project is embedded in this configuration.

Poster IMDb ratings use Kinopoisk Unofficial API. Store its API token as a
Cloudflare secret; it is never included in the frontend bundle:

```powershell
npx --yes wrangler@4.147.0 secret put KP_UNOFFICIAL_API_KEY --config workers/kinobox-search/wrangler.jsonc
```

Without this secret the poster endpoint returns `rating_imdb: null` and the
page keeps showing the Kinopoisk rating. Failed lookups are cached for five
minutes; successful ratings for three days.

## Prepare and deploy

From the Akaiho project root:

```powershell
npm run worker:prepare
npm run worker:test
npm run worker:deploy:dry
npx --yes wrangler@4.147.0 login
npm run worker:deploy
```

The prepare step downloads pinned TLS/HPACK modules, verifies their SHA-256
hashes, and writes ignored `vendor-*.mjs` files needed for deployment. The
Reclaim TLS license and dependency notices are included in this directory.

For local Worker development, run `npm run worker:dev` after preparing vendor
modules. The frontend's local origin `http://localhost:5173` is allowlisted.

## Connect Akaiho

Akaiho defaults to `https://akaiho-kinobox.akaiho.workers.dev`, the Worker URL
created by this configuration. Set `VITE_KINOBOX_API_URL` to another URL only
when overriding it, then rebuild Akaiho and configure the same variable in
GitLab CI/CD settings. `VITE_KINOBOX_SEARCH_API_URL` can optionally point search
to a separate Worker; when unset, it uses `VITE_KINOBOX_API_URL`.

## Routes

| Route                                               | Purpose                                    |
| --------------------------------------------------- | ------------------------------------------ |
| `/` or `/api/movies/search/`                        | Kinobox search (`query`, 1–150 characters) |
| `/api/movies/{id}`                                  | Kinobox movie details                      |
| `/api/players`                                      | Kinobox player sources                     |
| `/api/kinopoisk/top?type=movie\|series\|all\|anime` | Kinopoisk popular lists                    |

`all` interleaves the film and series lists. `anime` filters both lists by
the Anime genre and interleaves the results. Kinopoisk's GraphQL interface is
internal and may change without notice; failures are returned instead of
inventing results. The routes validate parameters, cap responses and reject
arbitrary upstream URLs, headers and queries. CORS allows the Akaiho GitLab
Pages origin, Akaiho Vercel production and preview origins, the legacy GitHub
Pages origin, and localhost development.

Kinobox responses are cached at the edge. Kinopoisk top responses are also
cached, while upstream failures are not. CORS is not authentication; monitor
usage and errors in the Cloudflare dashboard after deployment.
