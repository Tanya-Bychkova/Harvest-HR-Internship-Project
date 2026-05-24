# Harvest HR Download Package

This package contains the full Harvest HR project, not only the frontend.

## Backend files

- `server/index.ts` — Express server entry point
- `server/routes.ts` — API routes
- `server/storage.ts` — SQLite setup, table creation, storage methods
- `server/auth.ts` — password hashing, bearer-token auth, role checks
- `server/seed.ts` — demo/reference seed data
- `shared/schema.ts` — Drizzle tables, Zod schemas, shared types
- `data.db` — SQLite database

## Frontend files

- `client/src/` — React app
- `client/src/pages/` — app pages
- `client/src/components/` — UI and layout components

## How to run locally

```bash
npm install
npm run dev
```

The app runs on port `5000`.

## Production build

```bash
npm run build
npm start
```

## Demo accounts

- `admin@harvest.kz` / `admin123`
- `hr@harvest.kz` / `hr123`
- `manager@harvest.kz` / `manager123`
- `employee@harvest.kz` / `employee123`

## Reset database

```bash
rm -f data.db data.db-shm data.db-wal
npm run dev
```

The server will recreate all tables and seed demo data on startup.
