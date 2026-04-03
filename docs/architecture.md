# Architecture

## Phase 1 shape

The application is organized around a graph-centric frontend and a layered data pipeline.

### Frontend layers

- `src/app` hosts the root composition and page-level shell.
- `src/components` contains reusable UI surfaces without domain-specific ingestion logic.
- `src/features/graph` contains the live Sigma scene, graph adapters, filters, and detail-panel logic.

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

Phase 2 mounts Sigma.js imperatively inside the graph feature layer. React owns filter and selection UI state only. The mutable `Graphology` instance and `Sigma` renderer stay outside React state and refresh through reducer-driven display logic.
