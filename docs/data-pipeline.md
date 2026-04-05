# Data Pipeline

## Purpose

The pipeline separates source handling from product-facing graph presentation.

## Layers

### 1. Raw ingestion

Input contracts reflect source reality. The app now supports:

- the real Kaggle ADCC historical CSV in `data/raw/adcc/adcc_historical_data.csv`
- the sample fixture in `src/data/fixtures/adcc-sample.fixture.json`

The real-source adapter validates the exact detected Kaggle columns before any mapping occurs.

### 2. Source precedence

The ADCC pipeline now uses explicit source precedence:

1. Official ADCC event result pages
2. Kaggle historical dataset
3. Metadata-only athlete enrichment sources

Official event pages are authoritative for event/division/result rows. Kaggle is a secondary bootstrap and comparison source. Metadata enrichment sources must never be treated as match-truth.

### 3. Reconciliation

Reconciliation now happens before canonical athlete merging.

`buildAdccEventReconciliation` compares official parsed event rows against Kaggle-derived event/division evidence and emits:

- exact matches
- likely matches
- mismatches
- official-only rows
- Kaggle-only rows
- manual-review items

Current outputs live under `data/processed/adcc/reconciliation/`.

When an official event has result rows but Kaggle has no event rows for that year, the pipeline can promote those official-only rows into auditable `official_result_relation` records before normalization. This is how ADCC Worlds 2024 now enters the app-facing dataset without letting Kaggle override official event facts.

### 4. Cleaning layer

`buildAdccCleaningLayer` creates a provenance-rich intermediate artifact before app-facing normalization:

- canonical athlete ids
- explicit source provenance
- quarantine flags for suspicious identity conflicts
- sex and weight class preserved as separate fields

This layer is written to `data/processed/adcc/adcc-historical.cleaned-layer.json`.

### 5. Normalization

`normalizeAdccFixture` turns raw match records into canonical:

- athletes
- events
- matches

Normalization is now downstream of reconciliation and the cleaning layer. App-facing canonical merging should not happen until source conflicts and official-event comparisons have already been surfaced.

The current build promotes reconciled ADCC Worlds 2024 official rows into the fixture before normalization, so `2024` is present in the processed graph dataset and available to the `/universe` year filter.

For the Kaggle ADCC source:

- canonical athlete IDs prefer source athlete IDs when available
- source athlete ID `-1` is treated as a missing-value sentinel, not a real identity
- canonical match IDs prefer source match IDs when available
- event names are derived because the raw source lacks an explicit event-name field
- sex and `weightClass` remain separate canonical fields
- athlete records retain distinct `sexes` and `weightClasses` sets for filtering and diagnostics

### 6. Derived metrics

`buildAthleteMetrics` computes first-order analytics:

- wins
- losses
- years active
- rivalry counts
- bridge score

Future centrality and community-detection logic should enter here or adjacent metric modules.

### 7. Validation and diagnostics

`buildAthleteDiagnostics` and `buildAdccIntegrityReport` surface source-quality and identity-risk signals:

- top athletes by match count
- first and last active years
- edition-span warnings
- out-of-bounds year warnings
- cross-sex athletes
- initials and name-collision candidates
- source athlete ID conflicts
- missing known world-championship years that still lack either Kaggle rows or promoted official-result coverage

These diagnostics are written to `data/processed/adcc/adcc-historical.athlete-diagnostics.json` and summarized in the processed dataset metadata.

The broader integrity outputs now also include:

- `data/processed/adcc/adcc-historical.integrity-report.json`
- `data/processed/adcc/adcc-historical.integrity-report.md`

### 8. Graph view models

`buildGraphViewModel` produces typed node and edge payloads designed for rendering layers. UI code consumes these view models rather than raw match rows.

### 9. Scraping and enrichment

The repository now includes separate scripts for:

- scraping official ADCC event-result pages
- reconciling a multi-event official-results manifest against Kaggle rows
- generating athlete enrichment targets for athletes with more than 10 fights
- enriching athlete metadata from explicit public-source manifests

## Extension points

- Add alternative ingestors under `src/data/ingestion`.
- Add source parsers under `src/data/scraping`.
- Add source-specific metadata enrichers under `src/data/enrichment`.
- Preserve canonical domain types in `src/domain`.
- Add richer graph metadata without changing raw-source contracts.
- Keep quarantine reasons explicit when a source has schema or row-quality issues.
