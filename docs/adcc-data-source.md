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
- division label: currently combined as `<sex> <weight_class>` to avoid collisions between male and female classes
- event IDs, athlete IDs, and canonical match IDs in app space

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
- This is still one-source ingestion. Multi-source reconciliation is not yet implemented.
