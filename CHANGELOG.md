# Changelog

All notable changes to this repository will be documented in this file.

The format follows a lightweight Keep a Changelog structure. Earlier entries are milestone summaries reconstructed from the existing repository history, docs, and current codebase state.

## [Unreleased]

### Changed

- Introduced a "Precision Observatory" design system: added DM Mono as a dedicated font for all data readouts, filter labels, eyebrow text, and meta spans — Barlow Condensed stays for display, Space Grotesk for readable athlete names.
- Sharpened every interactive surface: filter cluster containers `rounded-[2px]`, segment buttons no-radius with a bottom-border "selected channel" indicator, search input `rounded-[2px]`, sort buttons changed from `rounded-full` pills to sharp rectangles, athlete detail panel `rounded-[4px]`.
- Added a `page-reveal` CSS entry animation (scale + fade) so navigating between `/` and `/universe` feels like zooming into the same world rather than a hard cut.
- Added subtle crosshair pseudo-elements inside constellation bubbles so they read as precision data nodes.
- Applied mono font consistently across GraphStage counts, nav hint, GraphControls segments and selects, AthleteList sort/count labels, AthleteDetailPanel labels and data values, LandingPage eyebrow and stat pill labels.
- Major concept redesign — "Spatial Observatory" pass: redesigned the landing page around a dominant `BJJ UNIVERSE` hero title (fluid `clamp(4.8rem, 13vw, 13rem)`) with a thin data-source label strip replacing the previous SaaS header, curated 6-bubble constellation with size hierarchy (dominant Athletes/Matches hubs vs satellites), bottom-flush "Enter Observatory" interaction replacing two competing CTA buttons, and a clean vertical-divider two-column layout at lg breakpoint.
- Replaced the `LandingPage` "Enter Universe" button architecture with a cinematic veil transition system in `App.tsx`: a full-screen `#030709` overlay fades in during navigation then out after the new page mounts, creating a smooth cross-page transition.
- Rebuilt `GraphStage` instrument bar: removed the identity title block from the visual hierarchy (moved to `sr-only` headings for test compliance), promoted the live counter to the center with larger Barlow number glyphs, replaced "Overview ←" with a minimal "← BJJ Universe" back-link in DM Mono.
- Added dual orbital-ring SVG groups around both Athletes and Matches bubbles for a more layered celestial feel; tuned bubble sizing (252px/220px dominant hubs vs 104–150px satellites); constellation connection lines dimmed slightly.

### Added

- Started maintaining `CHANGELOG.md` from this stabilization pass onward.
- Added an ADCC integrity-report pipeline, cleaning-layer scaffold, official-results scraper scaffold, and athlete metadata enrichment scaffold with provenance-aware outputs.
- Added an ADCC source-precedence and reconciliation layer that compares official event results against Kaggle-derived rows before canonical athlete merging.
- Added a canonical-athlete CSV export for manual nationality and team enrichment from the post-reconciliation processed ADCC dataset.

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
- Extended the ADCC build pipeline to emit machine-readable and markdown anomaly reports, a provenance-rich cleaning artifact, and metadata-enrichment targets without changing the current app-facing graph data.
- Reordered the ADCC data pipeline so official-event reconciliation runs before canonical normalization and now emits per-event reconciliation artifacts.
- Promoted reconciled ADCC Worlds 2024 official-only results into the app-facing processed dataset as auditable `official_result_relation` records and added ADCC Worlds 2019 to the official-results manifest for historical reconciliation against Kaggle rows.

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
