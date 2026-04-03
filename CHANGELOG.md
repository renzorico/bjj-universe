# Changelog

All notable changes to this repository will be documented in this file.

The format follows a lightweight Keep a Changelog structure. Earlier entries are milestone summaries reconstructed from the existing repository history, docs, and current codebase state.

## [Unreleased]

### Added

- Started maintaining `CHANGELOG.md` from this stabilization pass onward.

### Fixed

- Added a flag-based universe design mode and switched it on by default so the explorer can be visually polished against a static stage while the live graph renderer is temporarily decoupled.
- Hardened the live universe renderer by switching the active graph canvas to a safer 2D force-graph path with pinned positions, restoring reliable graph visibility with the real ADCC dataset.
- Improved the 2D graph readability by widening cluster spacing, reducing idle label clutter, and making selected-athlete versus neighbor versus background states much more explicit.
- Stabilized the graph interaction layer by simplifying camera behavior, repairing search overlay behavior, and restoring a deterministic reset view.
- Cleaned up the live `/universe` explorer by removing overlapping overlays, tightening the search and control surfaces, and improving mobile graph readability.
- Corrected the universe interaction layer by replacing the broken year-range filter, restoring deterministic reset behavior, and making node selection/focus states read clearly against the live 3D graph.

### Changed

- Reworked the `/universe` header, filter drawer, search surface, and detail chips around a static constellation-style stage so the page reads as a cleaner graph-first design composition.
- Reduced overlay noise in the `/universe` explorer and moved the primary framing into a cleaner top horizontal bar.
- Converted the graph controls into a lighter filter drawer and refined the universe header, utility chips, and search surface based on live visual QA.
- Reworked the graph structure to use stable sex, weight-class, and era-biased positioning instead of a single undifferentiated cloud.

## [Graph UI and data refinement]

### Added

- Split the ADCC schema into separate `sex` and `weightClass` fields.
- Added athlete diagnostics output for suspicious match-count and active-span anomalies.

### Fixed

- Corrected the missing-athlete `-1` source ID handling so unrelated competitors no longer collapse into one impossible athlete profile.
- Fixed the `E. Karppinen` anomaly by treating `-1` as missing and falling back to a name-plus-sex canonical athlete ID.

### Changed

- Replaced the combined division filter with separate sex and weight-class filters sourced from the processed dataset.

## [3D universe explorer]

### Added

- Upgraded the live graph renderer to a 3D force-directed scene using `react-force-graph-3d`.
- Added clustered force-based layout hints and a dedicated `/universe` graph explorer route.

### Changed

- Moved the project from an embedded graph section to a graph-first explorer page.

## [Real ADCC ingestion]

### Added

- Added Kaggle-backed ADCC historical ingestion, processed dataset generation, schema validation, quarantine outputs, and fixture-backed fallback support.
- Added deterministic processed outputs for local development and frontend graph consumption.

### Changed

- Switched the default frontend graph input from the sample fixture to the processed real ADCC dataset when available.

## [Interactive graph MVP]

### Added

- Introduced a real interactive athlete/match network with selection, hover emphasis, detail inspection, and filterable graph views.
- Added the first graph adapter tests, component selection coverage, and browser smoke coverage for the graph explorer flow.

### Changed

- Replaced the earliest fragile graph rendering path with a working force-graph-based implementation.

## [Project foundation]

### Added

- Bootstrapped the project with React, TypeScript, Vite, Tailwind, ESLint, Prettier, Vitest, React Testing Library, and Playwright.
- Added architecture, roadmap, and data-pipeline documentation.
- Added the first domain model, fixture-backed normalization, and baseline graph-ready view-model pipeline.
