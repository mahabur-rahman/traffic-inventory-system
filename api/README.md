# Techzu API - Real-Time High-Traffic Inventory (Sneaker Drop)

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

Requests identify a “user” via headers:
- `X-User-Id: <uuid>`
- `X-User-Name: <string>` (optional)

In `NODE_ENV=development`, if `X-User-Id` is a valid UUID but doesn’t exist yet, the API will auto-create a user (best-effort).

## Data Model (Summary)

- `users` (id, username unique)
- `drops` (name, currency, price, total_stock, available_stock, starts_at, ends_at, status)
- `reservations` (user_id, drop_id, status, expires_at)
- `purchases` (user_id, drop_id, reservation_id unique, qty, amount_cents, currency, status)

Notes:
- `drops.price` is stored as integer cents.
- One ACTIVE reservation per user per drop is enforced by a partial unique index.

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
  - Transaction:
    1) Atomic stock decrement: `available_stock = available_stock - 1` with `available_stock > 0`
    2) Create reservation with `expires_at = now + RESERVATION_TTL_SECONDS`
  - Errors: `DROP_NOT_FOUND`, `OUT_OF_STOCK`, `DROP_NOT_ACTIVE`, `ALREADY_RESERVED`

### Stock Recovery (60s TTL)

An in-process worker polls every `EXPIRY_POLL_MS`:
- marks expired `ACTIVE` reservations as `EXPIRED`
- restores stock (+1 per expired reservation) with `FOR UPDATE SKIP LOCKED` batching
- emits Socket.IO events after commit

Dev helper: `POST /api/internal/expire-now` (dev only)

### Purchase (Only If Reserved)

- `POST /api/drops/:dropId/purchase` (auth required)
  - Requires an ACTIVE, unexpired reservation for that drop by the same user
  - Marks reservation `CONSUMED` and creates a `paid` purchase
  - Stock is not decremented again (it was decremented at reserve time); it is “made permanent” by not restoring on expiry.

## Socket.IO Events

Server emits after DB commit:
- `DROP_CREATED` `{ drop }`
- `STOCK_UPDATED` `{ dropId, availableStock }`
- `RESERVATION_EXPIRED` `{ dropId, reservationId }`
- `PURCHASE_COMPLETED` `{ dropId, username, purchasedAt }`
- `ACTIVITY_UPDATED` `{ dropId, latestPurchasers: [{ userId, username, qty, createdAt }] }`

## Curl Examples

Create a drop:

```bash
curl -X POST http://localhost:4000/api/drops ^
  -H "Content-Type: application/json" ^
  -H "X-User-Id: <USER_UUID>" ^
  -d "{\"name\":\"Air Jordan 1\",\"currency\":\"USD\",\"price\":5000,\"total_stock\":3}"
```

List active drops:

```bash
curl http://localhost:4000/api/drops
```

Reserve:

```bash
curl -X POST http://localhost:4000/api/drops/<DROP_UUID>/reserve ^
  -H "X-User-Id: <USER_UUID>"
```

Purchase:

```bash
curl -X POST http://localhost:4000/api/drops/<DROP_UUID>/purchase ^
  -H "X-User-Id: <USER_UUID>"
```

## Seeding

- Default (development): `npm run db:seed` **truncates and reseeds** so you always get a clean dataset (15+ rows per table).
- Append (no truncate): `npm run db:seed -- --no-reset`
