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

## Data corrections and caveats

- The Kaggle CSV uses source athlete ID `-1` for many unrelated competitors. Treating `-1` as a real athlete ID collapses those rows into one impossible athlete, so normalization now treats `-1` as missing and falls back to a name-based canonical ID.
- This directly fixes the previously observed `E. Karppinen` anomaly. The raw source contains:
  - `E. Karppinen` in 2017, `F`, `60KG`
  - `Elvira Karppinen` in 2022, `F`, `60KG`
- These are now modeled as two distinct athletes because the source does not provide a safe shared ID. No alias merge rule is applied.
- Suspicious long-span athletes are surfaced in `adcc-historical.athlete-diagnostics.json` and in the processed validation summary. They are warnings, not auto-deletions.

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

## Current limitations

- The Kaggle CSV does not include nationality, team, or event location.
- The Kaggle CSV does not include a source event-name column, so event names are derived from dataset context and year.
- Some source athlete IDs still appear to conflate identities across unusually long spans or across both sexes. These are currently surfaced through diagnostics rather than silently rewritten unless there is a clearly safe rule.
- This is still one-source ingestion. Multi-source reconciliation is not yet implemented.
