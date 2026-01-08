# Techzu - Real-Time High-Traffic Inventory System - Web Dashboard

React + TypeScript + Vite + TailwindCSS + Redux Toolkit + TanStack Query + Socket.IO client.

## Run (Local)

1) Create `web/.env` from `web/.env.example`
2) Install + run:

```bash
cd web
npm install
npm run dev
```

Web URL: `http://localhost:5173`
- Login: `/`
- Dashboard: `/dashboard` (protected route)

## Environment

- `VITE_API_URL` (example: `http://localhost:4000/api`)
- `VITE_SOCKET_URL` (example: `http://localhost:4000`)

## Run on Your Network (LAN)

1) Run the dev server (LAN hosting is enabled):

```bash
cd web
npm run dev
```

2) Set `web/.env` for your LAN IP:
- `VITE_API_URL=http://<YOUR_LAN_IP>:4000/api`
- `VITE_SOCKET_URL=http://<YOUR_LAN_IP>:4000`

Then open: `http://<YOUR_LAN_IP>:5173`.

## How It Works

- Routing: `react-router-dom` (redirect to `/dashboard` after login; unauthenticated users are redirected back to `/`)
- Data fetching: TanStack Query (`GET /api/drops`, `GET /api/reservations/me`)
- Mutations: reserve + purchase + cancel reservation + create drop
- State: Redux Toolkit for session + socket connection status
- Real-time: Socket.IO events update the React Query cache (no full refetch for stock/activity)

## 2-minute Demo Script (Two Windows)

1) Terminal:
   - `cd api && npm run db:migrate`
   - `cd api && npm run db:seed:reset`
   - `cd api && npm run dev`
2) Terminal:
   - `cd web && npm run dev`
3) Open 2 windows at `http://localhost:5173`, sign in on both (redirects to `/dashboard`)
4) Reserve in window A -> window B stock updates instantly
5) Try last-stock concurrency -> only one succeeds (toast shows conflict)
6) Wait ~60s -> reservation expires and stock recovers
7) Reserve + Purchase -> "Latest purchasers" updates (top 3 per drop)
