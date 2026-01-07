# React + TypeScript + Vite

## Techzu Sneaker Drop Dashboard (MVP)

### Run

1) Create `web/.env` from `web/.env.example`
2) Start web:

```bash
cd web
npm install
npm run dev
```

Environment:

- `VITE_API_URL` (example: `http://localhost:4000/api`)
- `VITE_SOCKET_URL` (example: `http://localhost:4000`)

## Loom demo script (2 minutes)

1) Terminal:
   - `cd api && npm run db:migrate`
   - `cd api && npm run db:seed:reset` (adds 3 drops + sample purchases + expiry demo)
   - `cd api && npm run dev`
2) Terminal:
   - `cd web && npm run dev`
3) Browser: open 2 windows/tabs side-by-side at `http://localhost:5173`
4) Sign in on both tabs (username input)
5) Reserve in tab A:
   - show stock decrements in tab A
   - tab B updates instantly via socket (live stock changes + highlight)
6) Concurrency:
   - click Reserve quickly in both tabs on last stock
   - one succeeds, the other shows toast: “Someone else reserved it first”
7) Expiry:
   - wait ~60s for reservation countdown to hit 0
   - stock recovers and both tabs update
8) Purchase:
   - reserve then purchase
   - activity feed updates (top 3 purchasers with relative time)

### Wireframe (function over form)

```
Top Bar
  - App title (left)
  - Auth status + Sign out (right)

Main
  - If not signed in:
      - Login card (username input + continue)
  - If signed in:
      - Info banner (auth simulation note)
      - Active drops grid (cards)
          - name + price
          - live stock number (big)
          - status
          - latest 3 purchasers (username + time)
```

## UI checklist (requirements)

- Real-time stock updates: Socket.IO `STOCK_UPDATED` updates card count + highlight
- Live socket indicator: green/amber/red badge in status bar
- Loading states: skeleton cards on first load + per-button loading labels
- Concurrency feedback: toast rules map `OUT_OF_STOCK/CONFLICT/RESERVATION_EXPIRED` to warning/error/info
- Visible stock count: large number on each card

## Component structure plan

```
pages/
  Dashboard.tsx
components/
  DropCard.tsx
  DropCardSkeleton.tsx
  ErrorBanner.tsx
  LiveBadge.tsx
  StatusBar.tsx
  ToastSetup.tsx
lib/
  api.ts
  auth.ts
  errors.ts
  notify.ts
  time.ts
```

### Suggested folder structure

```
web/src/
  components/    # UI blocks
  hooks/         # reusable hooks (auth, sockets, etc)
  lib/           # api client, env, helpers
  types/         # shared TS types (API, entities)
```

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
