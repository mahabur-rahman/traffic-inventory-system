# API — Real-Time High-Traffic Inventory (Sneaker Drop)

Express + Sequelize + Postgres (Neon) + TypeScript + Socket.IO.

## Run

1) Create `api/.env` from `api/.env.example`
2) Install + migrate + run:

```bash
cd api
npm install
npm run db:migrate
npm run dev
```

## Seeding (mock data)

After migrations, seed mock data into all tables (users/drops/reservations/purchases):

- `npm run db:seed`
- Reset + seed (dev only): `npm run db:seed:reset`

Seed script: `api/src/scripts/seed.ts:1`

## Environment

See `api/.env.example:1`.

Required:

- `DATABASE_URL`

Recommended:

- `PORT`
- `CORS_ORIGINS` (comma-separated or `*`)
- `RESERVATION_TTL_SECONDS` (default `60`)
- `EXPIRY_POLL_MS` (default `2000`)
- `LOG_LEVEL`

## Structure (recommended)

```
api/src/
  config/        # env parsing
  controllers/   # HTTP handlers
  db/            # sequelize + migrations (umzug)
  middlewares/   # auth, validation, errors, logging
  models/        # sequelize models + associations
  realtime/      # socket.io server + emit helpers
  routes/        # express routers
  services/      # business logic + DB transactions
  validators/    # zod schemas
  workers/       # background jobs (expiry polling)
```

## API conventions

Base paths:

- Primary: `/api/*`
- Alias: `/api/v1/*`

Success envelope:

```json
{ "success": true, "data": {}, "meta": { "requestId": "..." } }
```

Error envelope:

```json
{ "success": false, "error": { "code": "OUT_OF_STOCK", "message": "..." }, "meta": { "requestId": "..." } }
```

## Auth placeholder

Header: `X-User-Id: <uuid>`

- Middleware: `api/src/middlewares/auth.ts:1`
- Dev mode: if `X-User-Id` is valid UUID but user doesn’t exist, it auto-creates a user (optional `X-User-Name`).
- Dev helper endpoint: `POST /api/internal/users` with `{ "username": "alice" }` (dev only).

## Data model (ERD summary)

Tables:

- `users` (id, username unique, createdAt, updatedAt)
- `drops` (name, price, total_stock, available_stock, starts_at, ends_at, status)
- `reservations` (drop_id, user_id, status, expires_at, createdAt, updatedAt)
- `purchases` (drop_id, user_id, qty, createdAt, …)

Relationships:

- `users 1 -> many drops` (`drops.created_by`)
- `users 1 -> many reservations` (`reservations.user_id`)
- `drops 1 -> many reservations` (`reservations.drop_id`)
- `users 1 -> many purchases` (`purchases.user_id`)
- `drops 1 -> many purchases` (`purchases.drop_id`)
- `reservations 0..1 <-> 0..1 purchases` (`purchases.reservation_id` unique)

Lifecycle statuses:

- `drops.status`: `draft|scheduled|live|ended|cancelled`
- `reservations.status`: `ACTIVE|EXPIRED|CANCELLED|CONSUMED`
- `purchases.status`: `pending|paid|failed|cancelled|refunded`

DB protections:

- Atomic stock decrement: `UPDATE drops SET available_stock = available_stock - 1 WHERE id=? AND available_stock > 0 RETURNING ...`
- Checks: `available_stock >= 0`, `available_stock <= total_stock`, `qty > 0`, valid status values
- Uniqueness: one ACTIVE reservation per user per drop (partial unique index)
- Indexes: active drops query, expiry scan, latest buyers

## Drops API

### POST `/api/drops`

Creates a drop and initializes stock:

- `available_stock = total_stock`
- If `status` not provided:
  - no `starts_at` → `draft`
  - future `starts_at` → `scheduled`
  - past/now `starts_at` → `live`

Implementation: `api/src/controllers/drops.controller.ts:1`, `api/src/services/drops.service.ts:1`

### GET `/api/drops`

Returns “active” drops:

- `starts_at <= now`
- `ends_at IS NULL OR ends_at > now`
- status in `scheduled|live`

Also returns “Drop Activity Feed”:

- `activity_feed.latest_purchasers`: top 3 latest successful purchasers per drop (username)
- Efficient query uses window function (`ROW_NUMBER() OVER (PARTITION BY drop_id ORDER BY createdAt DESC)`)

## Reservations API (atomic, no oversell)

Policy: **one ACTIVE reservation per user per drop** (DB-enforced).

### POST `/api/drops/:dropId/reserve`

Auth required. Reserves **1 unit**:

Transaction:

1) (Optional) expire user’s stale ACTIVE reservation for this drop and restore stock
2) Atomic decrement stock (oversell prevention)
3) Insert reservation with `expires_at = now() + RESERVATION_TTL_SECONDS`

Errors:

- `401 AUTH_REQUIRED`
- `404 DROP_NOT_FOUND`
- `409 DROP_NOT_ACTIVE`
- `409 OUT_OF_STOCK`
- `409 ALREADY_RESERVED`

Idempotency (optional recommendation):

- Accept `Idempotency-Key` header and persist it (e.g., on `reservations`) to return the same reservation for client retries without double-decrementing stock.

### GET `/api/reservations/me`

Auth required. Lists ACTIVE, unexpired reservations (for testing).

### DELETE `/api/reservations/:id/cancel` (optional)

Auth required. Cancels ACTIVE, unexpired reservation and restores stock (+1) in a transaction.

## Expiration & stock recovery

Strategy: Node background worker polling every ~`EXPIRY_POLL_MS` (simple MVP; restart-safe).

- On boot: runs one cleanup cycle immediately
- Then polls every interval

Concurrency-safe processing:

- `UPDATE reservations ... WHERE status='ACTIVE' AND expires_at <= now() ... FOR UPDATE SKIP LOCKED RETURNING ...`
- In same transaction: increment affected drops’ `available_stock`

Manual trigger (dev only):

- `POST /api/internal/expire-now`

Edge rule (purchase vs expiry at boundary):

- If `expires_at <= now()` at purchase time, purchase fails with `RESERVATION_EXPIRED` (reservation is marked EXPIRED and stock restored).

## Purchase API (only if reserved)

### POST `/api/drops/:dropId/purchase`

Auth required. Requires ACTIVE, unexpired reservation:

Transaction:

1) Lock reservation row (`SELECT ... FOR UPDATE`)
2) Validate ACTIVE and not expired
3) Mark reservation `CONSUMED`
4) Insert purchase (`qty=1`, `status='paid'`)

Rule: drop stock is **NOT decremented** again (it was decremented at reserve time).

## Socket.IO real-time sync

Server: `api/src/realtime/socket.ts:1` (wired in `api/src/server.ts:1`)

Rooms:

- all clients auto-join global room `drops`
- optional per-drop rooms: client emits `drops:join { dropId }` / `drops:leave { dropId }`

Events (primary contract):

- `DROP_CREATED` → `{ drop }`
- `STOCK_UPDATED` → `{ dropId, availableStock }`
- `RESERVATION_EXPIRED` → `{ dropId, reservationId }`
- `PURCHASE_COMPLETED` → `{ dropId, username, purchasedAt }`
- `ACTIVITY_UPDATED` → `{ dropId, latestPurchasers: [{ userId, username, qty, createdAt }] }`

Emitting rule:

- Emit only after DB commit (controllers emit after service transactions return; worker emits after expiry transaction completes).

Consistency note (DB is source of truth):

- Clients render stock from API (`GET /api/drops`) and treat Socket events as *real-time hints*.
- Every socket payload is derived from committed DB writes (emit-after-commit), so clients can safely update UI immediately; if a client reconnects/misses events it can refetch `/api/drops` to resync.

## Indexes (high-traffic rationale)

Recommended/used patterns:

- Active drops query: index `(status, starts_at, ends_at)` or at least `status`, `starts_at`, `ends_at`
- Stock updates: primary key on `drops.id` + keep updates as single-row `UPDATE ... WHERE id=? AND available_stock>0`
- Expiry scan: partial index on `reservations(expires_at)` where `status='ACTIVE'` (plus `(status, expires_at)` for batch scans)
- Latest purchasers: index on `purchases(drop_id, createdAt)` and filter on `status='paid'` to support the window-function ranking

## Curl examples

Create a user (dev helper) and copy the returned `id`:

```bash
curl -X POST http://localhost:4000/api/internal/users ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"alice\"}"
```

Create a drop (requires `X-User-Id`):

```bash
curl -X POST http://localhost:4000/api/drops ^
  -H "Content-Type: application/json" ^
  -H "X-User-Id: <USER_UUID>" ^
  -d "{\"name\":\"Air Jordan 1\",\"price\":5000,\"total_stock\":3,\"starts_at\":null,\"ends_at\":null}"
```

List active drops:

```bash
curl http://localhost:4000/api/drops
```

Reserve (atomic, no oversell):

```bash
curl -X POST http://localhost:4000/api/drops/<DROP_UUID>/reserve ^
  -H "X-User-Id: <USER_UUID>"
```

Reservation race test (bash): run many reserves at once and observe only up to stock succeeds, rest `409`:

```bash
for i in {1..20}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:4000/api/drops/<DROP_UUID>/reserve" -H "X-User-Id: <USER_UUID>" &
done
wait
```

View my active reservations:

```bash
curl http://localhost:4000/api/reservations/me -H "X-User-Id: <USER_UUID>"
```

Purchase (only if reserved):

```bash
curl -X POST http://localhost:4000/api/drops/<DROP_UUID>/purchase ^
  -H "X-User-Id: <USER_UUID>"
```

Trigger expiry processing (dev only):

```bash
curl -X POST http://localhost:4000/api/internal/expire-now
```
