# Techzu - Real-Time High-Traffic Inventory System (Sneaker Drop)

Backend: Node.js + Express + Sequelize + Postgres + Socket.IO  
Frontend: React (Vite) + TypeScript + TailwindCSS + Redux Toolkit + TanStack Query + Socket.IO client

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

API: `http://localhost:4000` (REST under `/api/*`)

### 2) Web

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

Web: `http://localhost:5173` (login at `/`, dashboard at `/dashboard`)

## Environment Variables

Never commit real credentials. Use `.env.example` as the template.

**API** (`api/.env`)
- `DATABASE_URL`
- `PORT` (default `4000`)
- `CORS_ORIGINS` (default `*`)
- `RESERVATION_TTL_SECONDS` (default `60`)
- `EXPIRY_POLL_MS` (default `2000`)

**Web** (`web/.env`)
- `VITE_API_URL` (example: `http://localhost:4000/api`)
- `VITE_SOCKET_URL` (example: `http://localhost:4000`)

## Architecture Notes

### Concurrency / Oversell Prevention

Reserve is an atomic Postgres update:
`UPDATE drops SET available_stock = available_stock - 1 WHERE id = ? AND available_stock > 0 RETURNING ...`

Only one concurrent request can claim the last unit; others return `409 OUT_OF_STOCK/CONFLICT`.

### Reservation Expiration (60s TTL) + Stock Recovery

An in-process worker polls every `EXPIRY_POLL_MS`:
- marks expired `ACTIVE` reservations as `EXPIRED`
- restores stock on affected drops
- emits Socket.IO events after DB commit

On boot, the worker runs a cleanup pass to recover after restarts.

### Purchase Flow

Users can only purchase if they have an ACTIVE, unexpired reservation for that drop.
Stock is decremented at reserve time; purchase consumes the reservation so it won't be restored.

### Real-Time Sync (Socket.IO)

Server emits after DB commit:
- `STOCK_UPDATED` (reserve/cancel/expiry)
- `RESERVATION_EXPIRED`
- `PURCHASE_COMPLETED`
- `ACTIVITY_UPDATED`
- `DROP_CREATED`

Frontend uses TanStack Query as the source of truth and applies socket events via cache updates.

## Loom Demo Checklist (2 minutes)

1) Start API + Web (see Quick Start)
2) Open **two browser windows** at `http://localhost:5173`
3) Sign in on both (redirects to `/dashboard`)
4) Reserve in window A -> stock updates instantly in window B
5) Click Reserve quickly in both windows on last stock -> only one succeeds
6) Wait ~60s -> reservation expires, stock recovers (both windows update)
7) Reserve + Purchase -> activity feed (top 3 purchasers) updates on each drop card

Tip: Create new drops via `POST /api/drops` or the web app's **Create drop** modal.

## Production Build

```bash
cd api && npm run build
cd web && npm run build
```

## Run on Your Network (LAN)

1) Start the API as usual.
2) Start the web dev server (it's configured to listen on your LAN):

```bash
cd web
npm run dev
```

3) Update `web/.env` to point at your PC's LAN IP:
- `VITE_API_URL=http://<YOUR_LAN_IP>:4000/api`
- `VITE_SOCKET_URL=http://<YOUR_LAN_IP>:4000`

Then open from another device: `http://<YOUR_LAN_IP>:5173`.
