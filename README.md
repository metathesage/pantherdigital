This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Robinhood Chain feed (letscash.fun)

The radar's **Robinhood Chain** feed is powered by [letscash.fun](https://www.letscash.fun/),
the memecoin launchpad on Robinhood Chain. It has no published JSON API, so:

- `src/lib/letscash.ts` — types, board sorts, the emergent-score model, and a
  defensive scraper. Anything that parses to fewer than `MIN_LIVE_TOKENS` rows is
  discarded, so a markup change can never render garbage.
- `src/data/letscash.json` — a snapshot of the board, chain receipts, fee flow,
  rank tiers and trade tape, captured from the live site. Served whenever
  upstream is unreachable; the payload says `live: false` in that case.
- `src/app/api/letscash/route.ts` — `?sort=trending|newest|mcap|burned|oldest`,
  `?kind=tape`, `?address=0x…`. Live scrape first, snapshot on any failure.
- `src/components/LetscashPanel.tsx` — chain receipts, "where the fees went",
  trader ranks, and a live trade tape.

The score is computed server-side (momentum + real cap + verified supply burn +
survivorship) and trusted by the client — the pair-engine formula is not reused,
because it knows nothing about launchpad age or burn.

## Tests

```bash
npm test       # data layer: parsing, scoring, sorts, snapshot integrity
npm run test:ui # SSR-renders LetscashPanel and asserts the real markup
npm run typecheck
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
