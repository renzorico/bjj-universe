# Data Pipeline

## Purpose

The pipeline separates source handling from product-facing graph presentation.

## Layers

### 1. Raw ingestion

Input contracts reflect source reality. For phase 1 that means `RawAdccFixture` and a clearly marked sample fixture file used for pipeline validation.

### 2. Normalization

`normalizeAdccFixture` turns raw match records into canonical:

- athletes
- events
- matches

Normalization is the place for deduplication, identifier creation, and source cleanup rules.

### 3. Derived metrics

`buildAthleteMetrics` computes first-order analytics:

- wins
- losses
- years active
- rivalry counts
- bridge score

Future centrality and community-detection logic should enter here or adjacent metric modules.

### 4. Graph view models

`buildGraphViewModel` produces typed node and edge payloads designed for rendering layers. UI code consumes these view models rather than raw match rows.

## Extension points

- Add alternative ingestors under `src/data/ingestion`.
- Preserve canonical domain types in `src/domain`.
- Add richer graph metadata without changing raw-source contracts.
