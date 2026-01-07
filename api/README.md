# API (Express + Sequelize + Postgres/Neon + TypeScript)

## Recommended layout

```
api/
  src/
    config/
      env.ts
    controllers/
      health.controller.ts
    db/
      migrations/
        0001-create-users.ts
      sequelize.ts
      umzug.ts
    middlewares/
      errorHandler.ts
      notFound.ts
    models/
      index.ts
      User.ts
    routes/
      health.routes.ts
      index.ts
    scripts/
      migrate.ts
    app.ts
    server.ts
  .env.example
  package.json
  tsconfig.json
```

## Setup

1) Create `api/.env` from `api/.env.example` and paste your Neon `DATABASE_URL`.

2) Install and run:

```bash
cd api
npm install
npm run dev
```

## Migrations (optional)

```bash
cd api
npm run db:migrate
```

## Endpoints

- `GET /health` (includes a quick DB auth check)

## API conventions

### Base URL

- Base path: `/api/v1`
- Example: `https://your-domain.com/api/v1/health`

### JSON response shape

Success:
```json
{
  "success": true,
  "data": {},
  "meta": { "requestId": "..." }
}
```

Error:
```json
{
  "success": false,
  "error": { "code": "NOT_FOUND", "message": "Not Found" },
  "meta": { "requestId": "..." }
}
```

### Error format

- Always return JSON with `success: false`.
- `error.code` is a stable, UPPER_SNAKE_CASE string for clients.
- `error.message` is a human-readable message.
- Optional `error.details` for validation/diagnostics (avoid sensitive data).

### HTTP status codes

- `200` OK (read/update success)
- `201` Created (create success)
- `204` No Content (success without body; use sparingly)
- `400` Bad Request (invalid input / parsing)
- `401` Unauthorized (missing/invalid auth)
- `403` Forbidden (auth ok, not allowed)
- `404` Not Found
- `409` Conflict (unique constraint, state conflict)
- `422` Unprocessable Entity (validation failure)
- `429` Too Many Requests
- `500` Internal Server Error (unexpected)
- `503` Service Unavailable (downstream dependency)

## Request validation (Zod)

Pattern: define a Zod schema and apply `validate({ body/query/params })` middleware.

- Middleware: `api/src/middlewares/validate.ts:1`
- Example route: `POST /api/v1/demo/echo` in `api/src/routes/demo.routes.ts:1`

Example request:
```bash
curl -X POST http://localhost:4000/api/v1/demo/echo ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"name\":\"Techzu\"}"
```

## Auth placeholder (X-User-Id)

For now, auth is a simple placeholder header:

- Header: `X-User-Id: <uuid>`
- Loader middleware (runs globally): `api/src/middlewares/auth.ts:1`
- Guard middleware (per-route): `requireUser`

Example protected endpoint:

- `GET /api/v1/me` (requires `X-User-Id`)

## Async error handling (concurrency-safe)

Express 4 does **not** automatically catch rejected Promises from `async` handlers/middlewares. Use the async wrapper everywhere you have `async` code:

- Wrapper: `api/src/utils/asyncHandler.ts:1`
- Example: `api/src/routes/health.routes.ts:1`

Pattern:

- For any `async (req, res) => { ... }` route handler: `router.get("/x", asyncHandler(handler))`
- For any `async` middleware in `app.use(...)`: `app.use(asyncHandler(middleware))`

Concurrency note: if you start background work (e.g. `Promise.all(...)`), always `await` it or catch errors; otherwise you’ll get `unhandledRejection` that bypasses Express.
