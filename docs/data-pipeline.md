# Data Pipeline

## Purpose

The pipeline separates source handling from product-facing graph presentation.

## Layers

### 1. Raw ingestion

Input contracts reflect source reality. The app now supports:

- the real Kaggle ADCC historical CSV in `data/raw/adcc/adcc_historical_data.csv`
- the sample fixture in `src/data/fixtures/adcc-sample.fixture.json`

The real-source adapter validates the exact detected Kaggle columns before any mapping occurs.

### 2. Normalization

`normalizeAdccFixture` turns raw match records into canonical:

- athletes
- events
- matches

Normalization is the place for deduplication, identifier creation, and source cleanup rules.

For the Kaggle ADCC source:

- canonical athlete IDs prefer source athlete IDs when available
- canonical match IDs prefer source match IDs when available
- event names are derived because the raw source lacks an explicit event-name field
- sex and weight class are combined into the current division label to avoid collisions

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
- Keep quarantine reasons explicit when a source has schema or row-quality issues.
