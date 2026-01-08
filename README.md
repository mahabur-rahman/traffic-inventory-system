# Techzu - Real-Time High-Traffic Inventory System (Sneaker Drop)

Backend: Node.js + Express + Sequelize + Postgres + Socket.IO  
Frontend: React (Vite) + TypeScript + TailwindCSS + Redux Toolkit + TanStack Query + Socket.IO client

Implements the assessment requirements:
- Real-time dashboard with live stock updates across tabs
- Atomic reservation (no oversell) with 60s TTL
- Automatic stock recovery on expiry + socket broadcasts
- Purchase flow (only if you reserved)
- Drop creation API (no admin UI) + per-drop activity feed (top 3 recent purchasers)

## Quick Start (Local)

### 1) API

```bash
cd api
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed:reset   # optional (recommended for demo data)
npm run dev
```

API runs at `http://localhost:4000` (REST under `/api/*`).

### 2) Web

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

Web runs at `http://localhost:5173`.

## Environment Variables

Never commit real credentials. Use `.env.example` as the template.

**API** (`api/.env`)
- `DATABASE_URL` (Postgres connection string)
- `PORT` (default `4000`)
- `CORS_ORIGINS` (default `*`)
- `RESERVATION_TTL_SECONDS` (default `60`)
- `EXPIRY_POLL_MS` (default `2000`)

**Web** (`web/.env`)
- `VITE_API_URL` (example: `http://localhost:4000/api`)
- `VITE_SOCKET_URL` (example: `http://localhost:4000`)

## Notes

- Prices are stored as integer cents in Postgres (`drops.price`).
- Auth is intentionally lightweight for the assessment: web sends `X-User-Id` and `X-User-Name` headers.

## Architecture (Summary)

### Oversell prevention (atomic reserve)

Reservations decrement stock with a single atomic SQL statement:
`UPDATE drops SET available_stock = available_stock - 1 WHERE id = ? AND available_stock > 0 RETURNING ...`

Only one concurrent request can claim the last unit; others receive `409 OUT_OF_STOCK/CONFLICT`.

### Expiration + stock recovery (60s TTL)

An in-process worker polls every `EXPIRY_POLL_MS`:
- marks expired `ACTIVE` reservations as `EXPIRED`
- restores stock on affected drops
- emits Socket.IO events after the DB commit

On boot, the worker runs one cleanup pass to recover from server restarts.

### Real-time sync (Socket.IO)

Server emits after DB commit:
- `STOCK_UPDATED` (reserve/cancel/expiry)
- `RESERVATION_EXPIRED`
- `PURCHASE_COMPLETED`
- `ACTIVITY_UPDATED`
- `DROP_CREATED`

Frontend uses TanStack Query as the source of truth and applies socket events via cache updates (no full refetch for stock/activity).

## Loom Demo Checklist (2 minutes)

1) Start API + Web (see Quick Start)
2) Open **two browser windows** side-by-side at `http://localhost:5173`
3) Sign in on both
4) Reserve in window A -> stock updates instantly in window B
5) Click Reserve quickly in both windows on last stock -> only one succeeds (toast shows concurrency)
6) Wait ~60s -> reservation expires, stock recovers (both windows update)
7) Reserve + Purchase -> activity feed (top 3 purchasers) updates on each drop card

Tip: You can create new drops via the API (`POST /api/drops`) or from the web app’s optional “Create Drop (API)” panel.

## Production Build

```bash
cd api && npm run build
cd web && npm run build
```
