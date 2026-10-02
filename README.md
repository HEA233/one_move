# GHOSTED Stage 1 Preview

This repository contains a keyless preparation scaffold for EAT_HACK. It is not the competition product. The application provides a preview landing page, an empty sandbox route, and a process health check. It does not call an AI provider, a database, or an upload service.

## Run locally

Use Node.js 24.1.0 and npm 11.3.0. Stage 1 runs without `.env.local` or credentials. Stage 4 will add the environment template.

```sh
npm install
npm run dev
```

Open `http://localhost:3000` for the preview or `http://localhost:3000/sandbox` for the empty Stage 2 shell. `GET /api/health` returns `{ "status": "ok", "mode": "preview" }`.

## Checks

```sh
npx playwright install chromium
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run check:env
npm run check:boundaries
npm run smoke:db
npm run smoke:ai:text
npm run smoke:ai:image
```

The database and AI smoke commands intentionally print `Stage 1 SKIPPED_ENV`. They do not read credentials, initialize SDKs, or make network requests.

## Scope

Stage 1 includes the Next.js App Router scaffold, strict TypeScript, Tailwind CSS, linting, schema validation, local tests, and the requested dependency packages. Product interactions, AI and database connections, uploads, and public integration endpoints are not implemented. Those capabilities require a later approved stage.
