# Decision Log

## D-001 React + TypeScript + Vite

Chosen because it matches the repository guidance, keeps the foundation lightweight, and supports a strict TypeScript-first architecture without unnecessary framework overhead.

## D-002 Tailwind CSS v4

Chosen for fast visual iteration with enough control to avoid generic UI-library output. The product needs a premium visual language early.

## D-003 Layered graph pipeline

Raw ingestion, normalization, metrics, and graph view models are intentionally separate so future data sources and analytics do not leak into rendering code.
