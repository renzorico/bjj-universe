# Architecture

## Phase 1 shape

The application is organized around a graph-centric frontend and a layered data pipeline.

### Frontend layers

- `src/app` hosts the root composition and page-level shell.
- `src/components` contains reusable UI surfaces without domain-specific ingestion logic.
- `src/features/graph` contains graph presentation utilities and future graph-scene integration points.

### Data layers

- `src/data/fixtures` contains clearly marked local fixtures for development and tests.
- `src/data/normalization` converts raw source records into canonical domain entities.
- `src/data/metrics` computes derived analytics from normalized entities.
- `src/data/graph` converts canonical data plus metrics into UI-facing graph view models.

### Domain layer

- `src/domain/types.ts` defines the stable vocabulary for athletes, events, matches, filters, and graph view models.

## Why this split

The core constraint is future expansion. ADCC data is only the first source. The codebase must remain open to IBJJF rankings, richer athlete metadata, Elo systems, community detection, and inferred matchups without forcing frontend components to understand raw source shapes.

## Rendering direction

Phase 1 uses a premium shell and a graph preview surface rather than a blank starter page. A real Sigma.js scene can later plug into `src/features/graph` without changing domain contracts or metric transforms.
