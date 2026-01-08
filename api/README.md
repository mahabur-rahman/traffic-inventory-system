# Real-Time High-Traffic Inventory System - API (Sneaker Drop)

Express + Sequelize + Postgres + TypeScript + Socket.IO.

## Run (Local)

1) Create `api/.env` from `api/.env.example`
2) Install + migrate + seed (optional) + run:

```bash
cd api
npm install
npm run db:migrate
npm run db:seed:reset   # optional (recommended for demo data)
npm run dev
```

API base URL: `http://localhost:4000/api`

## Environment

See `api/.env.example`.

Required:
- `DATABASE_URL`

Common:
- `PORT` (default `4000`)
- `CORS_ORIGINS` (comma-separated or `*`)
- `RESERVATION_TTL_SECONDS` (default `60`)
- `EXPIRY_POLL_MS` (default `2000`)

## Auth (Assessment-Style)

Requests identify a user via headers:
- `X-User-Id: <uuid>`
- `X-User-Name: <string>` (optional)

In `NODE_ENV=development`, if `X-User-Id` is a valid UUID but doesn’t exist yet, the API will auto-create a user (best-effort).

## Core API

### Drops

- `POST /api/drops` (auth required)
  - Body: `{ name, price, currency?, total_stock, starts_at?, ends_at?, status? }`
  - Initializes `available_stock = total_stock`
  - If `status` not provided: derives `draft|scheduled|live` from `starts_at`
- `GET /api/drops`
  - Returns active drops (`scheduled|live`, within start/end window)
  - Includes `activity_feed.latest_purchasers` (top 3 most recent `paid` purchases with usernames)

### Reservations (Atomic, No Oversell)

- `POST /api/drops/:dropId/reserve` (auth required)
  - Atomic decrement (`available_stock - 1` with `available_stock > 0`) + create reservation with expiry

### Stock Recovery (60s TTL)

An in-process worker polls every `EXPIRY_POLL_MS`:
- marks expired `ACTIVE` reservations as `EXPIRED`
- restores stock with `FOR UPDATE SKIP LOCKED` batching
- emits Socket.IO events after commit

Dev helper: `POST /api/internal/expire-now` (dev only)

### Purchase (Only If Reserved)

- `POST /api/drops/:dropId/purchase` (auth required)
  - Requires an ACTIVE, unexpired reservation for that drop by the same user
  - Marks reservation `CONSUMED` and creates a `paid` purchase
  - Stock is decremented at reserve time; purchase consumes the reservation so it won’t be restored.

## Socket.IO Events

Server emits after DB commit:
- `DROP_CREATED` `{ drop }`
- `STOCK_UPDATED` `{ dropId, availableStock }`
- `RESERVATION_EXPIRED` `{ dropId, reservationId }`
- `PURCHASE_COMPLETED` `{ dropId, username, purchasedAt }`
- `ACTIVITY_UPDATED` `{ dropId, latestPurchasers: [{ userId, username, qty, createdAt }] }`

## Seeding

- Default (development): `npm run db:seed` truncates and reseeds so you always get a clean dataset (15+ rows per table).
- Append (no truncate): `npm run db:seed -- --no-reset`
