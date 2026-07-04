Morsel is a Next.js app for publishing and unlocking paid recipes with wallet-based auth and x402 payments on Base.

## Environment

Create a local `.env.local` from `.env.example`.

`NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is required for production WalletConnect/Rainbow mobile wallet flows. Create one at [Reown Cloud](https://cloud.reown.com).

`NEXT_PUBLIC_BASE_RPC_URL` is optional locally, but production should use a dedicated browser-safe Base RPC URL instead of public defaults.

`MORSEL_ACCESS_TOKEN_SECRET` signs recipe access cookies after x402 settlement. If unset, the app falls back to `DATABASE_URL`.

`MORSEL_SEED_ADMIN_SECRET` enables the manual sample-data seed endpoint. Leave it unset in deployed environments unless you intentionally need admin-only reseeding.

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

Sample data is not created automatically during normal app startup. To seed the built-in sample creator and recipes in development, set `MORSEL_SEED_ADMIN_SECRET` and call:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "x-morsel-seed-secret: $MORSEL_SEED_ADMIN_SECRET"
```

The seed operation only upserts the known sample rows; it does not delete existing creators or recipes.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
