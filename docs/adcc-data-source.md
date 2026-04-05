# ADCC Data Source

## Primary source

The real input source is Kaggle dataset `bjagrelli/adcc-historical-dataset`.

Current raw file:

- `data/raw/adcc/adcc_historical_data.csv`

Current processed outputs:

- `src/data/processed/adcc-historical.processed.json`
- `data/processed/adcc/adcc-historical.validation-summary.json`
- `data/processed/adcc/adcc-historical.quarantine.json`
- `data/processed/adcc/adcc-historical.schema.json`
- `data/processed/adcc/adcc-historical.athlete-diagnostics.json`
- `data/processed/adcc/adcc-historical.integrity-report.json`
- `data/processed/adcc/adcc-historical.integrity-report.md`
- `data/processed/adcc/adcc-historical.cleaned-layer.json`
- `data/processed/adcc/adcc-historical.enrichment-targets.json`
- `data/processed/adcc/reconciliation/*.reconciliation.json`
- `data/processed/adcc/reconciliation/*.reconciliation.md`
- `data/processed/adcc/scraped-events/*.json`

## Source shape

The source is match-level. The current file contains 1,028 match rows and these detected columns:

- `match_id`
- `winner_id`
- `winner_name`
- `loser_id`
- `loser_name`
- `win_type`
- `submission`
- `winner_points`
- `loser_points`
- `adv_pen`
- `weight_class`
- `sex`
- `stage`
- `year`

## What is real

- winner and loser identities
- source match IDs
- source athlete IDs
- win type
- submission text when present
- points columns
- advantage/penalty marker when present
- weight class
- sex
- stage
- year

## What is derived

- event name: currently normalized to `ADCC World Championship`
- canonical event IDs, athlete IDs, and match IDs in app space
- athlete `sexes` and `weightClasses` sets derived from observed match rows
- fallback athlete IDs based on `name + sex` when the source athlete ID is the `-1` missing-value sentinel
- auditable `official_result_relation` match records promoted from reconciled official-only event rows when Kaggle has no event rows for that event year

## Source precedence

1. Official ADCC event result pages are the highest-trust source for event, division, and podium/result truth.
2. The Kaggle historical CSV is a secondary bootstrap source and comparison source.
3. Athlete metadata sources are metadata-only and must not override event-result truth.

## Data corrections and caveats

- The Kaggle CSV uses source athlete ID `-1` for many unrelated competitors. Treating `-1` as a real athlete ID collapses those rows into one impossible athlete, so normalization now treats `-1` as missing and falls back to a name-based canonical ID.
- This directly fixes the previously observed `E. Karppinen` anomaly. The raw source contains:
  - `E. Karppinen` in 2017, `F`, `60KG`
  - `Elvira Karppinen` in 2022, `F`, `60KG`
- These are now modeled as two distinct athletes because the source does not provide a safe shared ID. No alias merge rule is applied.
- Suspicious long-span athletes are surfaced in `adcc-historical.athlete-diagnostics.json` and in the processed validation summary. They are warnings, not auto-deletions.
- Reconciliation now happens before app-facing canonical athlete merging. This keeps bad source IDs and shorthand names from becoming canonical before official-event comparisons are available.
- ADCC Worlds 2024 is now present in the app-facing processed dataset through promoted official result relations sourced from `adcc-worlds-2024.reconciliation.json`. These rows are explicitly marked as official-derived, not blended back into Kaggle source truth.

## Download and refresh

Automated refresh:

1. `npm run data:adcc:download`
2. `npm run data:adcc:build`

One-shot refresh:

1. `npm run data:adcc:refresh`

## Manual fallback

If automated download is unavailable, place the real CSV at:

- `data/raw/adcc/adcc_historical_data.csv`

Then run:

1. `npm run data:adcc:build`

## Official manifest coverage

The official-results manifest currently includes:

- ADCC Worlds 2019
- ADCC Worlds 2024

This gives the pipeline one historical event with real Kaggle overlap for reconciliation and one post-Kaggle event that is promoted into the app-facing dataset.

## Current limitations

- The Kaggle CSV does not include nationality, team, or event location.
- The Kaggle CSV does not include a source event-name column, so event names are derived from dataset context and year.
- Some source athlete IDs still appear to conflate identities across unusually long spans or across both sexes. These are currently surfaced through diagnostics rather than silently rewritten unless there is a clearly safe rule.
- Official-event reconciliation coverage is still partial. Only the events listed in `data/raw/adcc/official-results-manifest.json` are currently scraped, reconciled, and eligible for promotion.
- The Kaggle CSV still stops at 2022. Later years require official-source ingestion to appear in the app-facing dataset.

## New scripts

- `npm run data:adcc:build`
  - rebuilds the processed dataset, reconciliation artifacts, any promoted official-result relations, athlete diagnostics, integrity report, cleaning-layer artifact, and enrichment target list
- `npm run data:adcc:reconcile`
  - reruns the reconciliation step through the dataset build pipeline using `data/raw/adcc/official-results-manifest.json`
- `npm run data:adcc:scrape:event -- --url <official-results-url> --slug <output-slug>`
  - fetches one official ADCC result page, saves raw HTML, and writes structured parsed JSON
- `npm run data:adcc:enrichment:targets`
  - regenerates the athlete metadata target list for athletes with more than 10 fights
- `npm run data:adcc:enrichment:run`
  - fetches athlete profile pages listed in `data/raw/adcc/athlete-metadata-source-manifest.json` and writes structured enrichment output
