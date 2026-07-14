# QR Menu & POS — Frontend

React 19 + TypeScript + Vite + Tailwind SPA for the QR Menu & POS Restaurant
Management System. Companion backend repo:
[rms_nagamani_backend](https://github.com/pandukayala2-maker/rms_nagamani_backend).

## Stack

React 19, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query &
Table, Zustand, React Hook Form + Zod, Axios, Framer Motion, Recharts, React
Icons, Sonner.

## Local setup

```bash
npm install
npm run dev   # http://localhost:5173 — proxies /api and /uploads to
              # localhost:5000, so run the backend alongside this
```

## Deploying to Vercel (free tier)

1. New Project → import this repo (framework preset: Vite).
2. Environment variable: `VITE_API_BASE_URL` = your deployed backend's URL +
   `/api/v1`, e.g. `https://rms-nagamani-backend.onrender.com/api/v1`.
3. Deploy. Then go back to the backend's Render env vars and set `CLIENT_URL`
   to this Vercel URL (no trailing slash), and redeploy the backend so CORS
   and the login cookie accept requests from it.

`vercel.json` already handles client-side routing (SPA rewrite to
`index.html`).

## How the app talks to the backend

- `src/lib/axios.ts` reads `VITE_API_BASE_URL` (falls back to the local proxy
  path `/api/v1` when unset, for same-origin dev/Docker setups).
- `src/lib/assets.ts` resolves backend-relative image/QR paths (e.g.
  `/uploads/images/x.png`) against the backend's origin, since in production
  this app and the API live on different domains.
- Refresh-token auth uses an httpOnly cookie; the backend sets
  `SameSite=None; Secure` for it in production for cross-site requests to
  work between Vercel and Render.

## Project layout

`src/pages/<domain>` per screen, `src/components/{ui,layout}` for shared UI,
`src/hooks/use<Domain>.ts` for TanStack Query data hooks, `src/store/*` for
Zustand state (auth, theme, POS cart), `src/routes/router.tsx` for routing +
role-gated access.
