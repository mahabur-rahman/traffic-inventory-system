# Real-Time High-Traffic Inventory System - Web Dashboard

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

## Environment

- `VITE_API_URL` (example: `http://localhost:4000/api`)
- `VITE_SOCKET_URL` (example: `http://localhost:4000`)

## How It Works

- Data fetching: TanStack Query (`GET /api/drops`, `GET /api/reservations/me`)
- Mutations: reserve + purchase (shows loading state and toast feedback)
- Drop creation: optional "Create Drop (API)" panel calls `POST /api/drops`
- State: Redux Toolkit for session + socket connection status
- Real-time: Socket.IO events update the React Query cache (no full refetch for stock/activity)

## 2-minute Demo Script (Two Windows)

1) Start API:
   - `cd api && npm run db:migrate`
   - `cd api && npm run db:seed:reset`
   - `cd api && npm run dev`
2) Start web:
   - `cd web && npm run dev`
3) Open 2 browser windows at `http://localhost:5173`
4) Sign in on both windows
5) Reserve in window A -> window B stock updates instantly
6) Try last-stock concurrency -> only one succeeds (toast shows conflict)
7) Wait ~60s -> reservation expires and stock recovers
8) Reserve + Purchase -> “Latest purchasers” updates (top 3 per drop)
