# BJJ Universe

BJJ Universe is a graph-first exploration platform for Brazilian Jiu-Jitsu competition networks. The phase 1 goal is a production-grade foundation: strict TypeScript, a premium visual shell, documented data boundaries, and testable transformation logic that can grow into a serious analytics product.

## Vision

- Athletes become nodes.
- Matches become directed winner-to-loser edges.
- Users will explore rivalries, eras, bridges, clusters, and missing matchups.
- The interface should feel like a living grappling atlas rather than a generic dashboard.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Graphology and Sigma.js for future network rendering
- Vitest and React Testing Library
- Playwright
- ESLint and Prettier

## Scripts

- `npm run dev` starts the local app.
- `npm run build` runs TypeScript project build and Vite production build.
- `npm run lint` runs ESLint.
- `npm run typecheck` runs strict TypeScript checks.
- `npm run test` runs unit and component tests with coverage.
- `npm run test:e2e` runs the Playwright smoke test.
- `npm run format` formats the repo with Prettier.
- `npm run data:adcc:download` downloads the Kaggle ADCC historical CSV into `data/raw/adcc/`.
- `npm run data:adcc:build` validates and converts the raw ADCC CSV into processed app-ready JSON.
- `npm run data:adcc:refresh` downloads and rebuilds the ADCC dataset in one pass.

## Project structure

- `src/app` application entry and shell
- `src/components` reusable layout and presentation surfaces
- `src/domain` core domain types
- `src/data/fixtures` clearly marked sample fixture data
- `src/data/processed` deterministic processed outputs used by the app
- `src/data/normalization` raw-to-domain transforms
- `src/data/validation` processed dataset loading
- `src/data/metrics` derived analytics snapshots
- `src/data/graph` UI-facing graph view models
- `data/raw` checked-in raw source files for reproducible local dev
- `data/processed` validation and quarantine reports
- `docs` architecture, roadmap, data pipeline, and decisions
- `tests/e2e` Playwright smoke coverage

## Data policy

The app now prefers the processed real ADCC dataset in `src/data/processed/adcc-historical.processed.json`. The sample fixture in `src/data/fixtures/adcc-sample.fixture.json` remains for deterministic ingestion tests and fallback behavior. It is not represented as a complete or authoritative production dataset.

## Getting started

1. Install dependencies with `npm install`.
2. Start the app with `npm run dev`.
3. Run checks with `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`.

## Documentation

- [Architecture](./docs/architecture.md)
- [Data pipeline](./docs/data-pipeline.md)
- [ADCC data source](./docs/adcc-data-source.md)
- [Roadmap](./docs/roadmap.md)
- [Decisions](./docs/decisions.md)
