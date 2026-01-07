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
