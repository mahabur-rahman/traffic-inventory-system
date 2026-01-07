# Techzu — Real-Time High‑Traffic Inventory System (Sneaker Drop)

Backend: Node.js + Express + Sequelize + Postgres (Neon) + Socket.IO  
Frontend: React (Vite) + TypeScript + Tailwind + Redux Toolkit + TanStack Query + Socket.IO Client

## Quick Start (Local)

### 1) API

```bash
cd api
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed:reset   # optional, recommended for demo data
npm run dev
```

API runs at `http://localhost:4000`.

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
- `DATABASE_URL` (Neon Postgres connection string)
- `PORT` (default `4000`)
- `CORS_ORIGINS` (default `*`)
- `RESERVATION_TTL_SECONDS` (default `60`)
- `EXPIRY_POLL_MS` (default `2000`)

**Web** (`web/.env`)
- `VITE_API_URL` (example: `http://localhost:4000/api`)
- `VITE_SOCKET_URL` (example: `http://localhost:4000`)

## Architecture Notes

### Concurrency / Oversell Prevention

Reservations use an atomic Postgres update:

`UPDATE drops SET available_stock = available_stock - 1 WHERE id = ? AND available_stock > 0 RETURNING ...`

Only one concurrent request can decrement the last unit; others get `OUT_OF_STOCK/CONFLICT`.

### Reservation Expiration (60s TTL)

An in-process worker polls every `EXPIRY_POLL_MS`:
- marks expired `ACTIVE` reservations as `EXPIRED`
- restores stock back to the related drop(s)
- emits Socket.IO events after commit

On boot, the worker runs one cleanup pass to recover from server restarts.

### Real-Time Sync (Socket.IO)

Server emits after DB commit:
- `STOCK_UPDATED` (reserve/cancel/expiry)
- `RESERVATION_EXPIRED`
- `PURCHASE_COMPLETED`
- `ACTIVITY_UPDATED`
- `DROP_CREATED`

Frontend uses TanStack Query for server state and applies socket events via `queryClient.setQueryData` (no full refetch for stock/activity).

## Demo Checklist (Loom)

1) Start API + Web (see Quick Start)
2) Open **two browser windows** side-by-side
3) Sign in on both (session simulated; UUID sent via `X-User-Id`)
4) Reserve in window A → stock updates instantly in window B
5) Try last-stock concurrency → one succeeds, other shows: “Someone else reserved it first”
6) Wait ~60s → reservation expires, stock recovers (both windows update)
7) Reserve + Purchase → activity feed (top 3 purchasers) updates on each drop card

