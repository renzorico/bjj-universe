# ADCC Scraper Plan

## Goal

Reduce dependence on the current Kaggle-only historical CSV by building an auditable ADCC data pipeline with explicit provenance, rerunnable scraping, and separate metadata enrichment.

## Target sources

### Match and event results

- Official ADCC event result pages on `adcombat.com`
- Priority starting point:
  - `https://adcombat.com/adcc-events/adcc-submission-fighting-world-championship-2024/`

### Athlete metadata

- Public athlete profile sources with explicit text for nationality and academy/team
- Initial supported source:
  - BJJ Heroes athlete profiles

## Fields we need

### Event/results layer

- event title
- event year
- event date
- event location
- organizer
- division label
- normalized sex
- normalized weight class
- placements per division
- source URL
- scrape timestamp
- raw HTML snapshot path

### Match layer

- winner
- loser
- division
- sex
- weight class
- stage/round
- method
- points or score where available
- source match identifier where available
- provenance per record

### Athlete enrichment layer

- athlete canonical id
- athlete display name
- nationality
- academy/team
- confidence per field
- source URL and source name per field
- extraction timestamp

## Pipeline shape

### 1. Raw

- Save raw HTML/JSON exactly as fetched under `data/raw/adcc/`
- Use deterministic slugs per source page or athlete profile
- Never overwrite provenance in processed outputs without keeping raw snapshots

### 2. Parsed

- Parse raw pages into structured source-shaped JSON
- Keep parsed outputs under `data/processed/adcc/scraped-events/`
- Preserve original division labels and source URLs

### 3. Normalized

- Map source-shaped records into canonical event, athlete, and match records
- Separate sex and weight class
- Keep canonical athlete ids separate from display names
- Carry provenance forward

### 4. Cleaned

- Run the cleaning layer before app-facing normalization
- Flag suspicious merges and cross-sex source ids
- Quarantine suspicious records instead of silently rewriting them

### 5. Enriched

- Run athlete metadata enrichment separately from results scraping
- Only target athletes above the configured match threshold
- Store confidence and provenance per enriched field

## Storage layout

- `data/raw/adcc/adcc_historical_data.csv`
- `data/raw/adcc/scraped-events/*.html`
- `data/raw/adcc/athlete-metadata/*.html`
- `data/raw/adcc/athlete-metadata-source-manifest.json`
- `data/processed/adcc/adcc-historical.*`
- `data/processed/adcc/scraped-events/*.json`
- `data/processed/adcc/adcc-historical.athlete-metadata.json`

## Re-runs and provenance

- Scripts should be deterministic for the same raw inputs
- Each parsed or enriched output must include:
  - source URL
  - scrape timestamp
  - source name
- Re-runs should overwrite generated outputs but keep raw snapshots auditable

## Handling missing metadata

- Missing nationality or academy is acceptable
- Do not infer unsupported values from name, flag, or gym branding
- Emit partial enrichment records when only one field is supported by the source
- Leave unresolved records blank rather than guessing
