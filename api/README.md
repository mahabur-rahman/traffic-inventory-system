# API (Express + Sequelize + Postgres/Neon)

## Recommended layout

```
api/
  src/
    config/
      env.js
      database.js
    controllers/
      health.controller.js
    middlewares/
      errorHandler.js
      notFound.js
    models/
      index.js
      User.js
    routes/
      health.routes.js
      index.js
    app.js
    server.js
  sequelize/
    config/
      config.js
    migrations/
    seeders/
  .env.example
  .sequelizerc
  package.json
```

## Setup

1) Create `api/.env` from `api/.env.example` and paste your Neon `DATABASE_URL`.

2) Install and run:

```bash
cd api
npm install
npm run dev
```

## Endpoints

- `GET /health` (includes a quick DB auth check)

