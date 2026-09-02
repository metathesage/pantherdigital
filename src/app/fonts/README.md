# Vendored fonts

Self-hosted Geist / Geist Mono variable fonts, served through `next/font/local` in
`src/app/layout.tsx`.

These replace `next/font/google`. Google's hosted API (`fonts.googleapis.com`) is fetched
at **build** time by `next/font/google`, and if the build machine cannot reach it — CI
runner, sandboxed deploy, offline or firewalled host, most corporate networks — the fetch
fails and **the entire `next build` aborts**, so the site does not deploy at all. The
error looks like:

    Error: next/font: error: Failed to fetch Geist from Google Fonts.

Self-hosting removes the network from the build path entirely: same fonts, same CSS
variables, no external request, no layout shift.

## Provenance

| File                                | Source package                     | Subset     |
| ----------------------------------- | ---------------------------------- | ---------- |
| `geist-latin-wght-normal.woff2`     | `@fontsource-variable/geist`       | latin      |
| `geist-latin-ext-wght-normal.woff2` | `@fontsource-variable/geist`       | latin-ext  |
| `geist-mono-latin-wght-normal.woff2`| `@fontsource-variable/geist-mono`  | latin      |
| `geist-mono-latin-ext-wght-normal.woff2` | `@fontsource-variable/geist-mono` | latin-ext |

Upstream: <https://github.com/vercel/geist-font>

## License

SIL Open Font License 1.1 — see `OFL.txt` in this directory. Bundling and redistributing
the font files with this application is permitted by that license.

## Refreshing

```bash
npm i -D @fontsource-variable/geist @fontsource-variable/geist-mono
cp node_modules/@fontsource-variable/geist/files/geist-latin*-wght-normal.woff2 src/app/fonts/
cp node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin*-wght-normal.woff2 src/app/fonts/
npm rm @fontsource-variable/geist @fontsource-variable/geist-mono
```

Keep the filenames in sync with the `src` array in `src/app/layout.tsx`.
