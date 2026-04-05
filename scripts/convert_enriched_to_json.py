#!/usr/bin/env python3
"""Convert the enriched athlete CSV and match mapping CSV to JSON for runtime use.

Merges pre-2024 CSV-based matches with 2024 placement data from processed.json.
Handles athlete alias mapping between the processed dataset and enriched CSV IDs.
"""

import csv
import json
import os
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

athletes_csv = os.path.join(BASE, "data/processed/adcc/adcc_athletes_final.csv")
mapping_csv = os.path.join(BASE, "scripts/adcc_match_athlete_mapping.csv")
processed_json = os.path.join(BASE, "src/data/processed/adcc-historical.processed.json")
out_dir = os.path.join(BASE, "src/data/processed")

# Alias map: processed.json athlete ID → enriched CSV athlete ID
# These handle nickname/abbreviation differences between the scraped 2024 results
# and the canonical enriched athlete names from the Kaggle-era pipeline.
ATHLETE_ALIAS_MAP = {
    "athlete_bia-mesquita-f": "athlete_beatriz-mesquita-f",
    "athlete_ana-vieira-f": "athlete_ana-carolina-vieira-f",
    "athlete_daniel-manasoiu-m": "athlete_dan-manasoiu-m",
    "athlete_diego-pato-m": "athlete_diego-oliveira-m",
    "athlete_josh-cisneros-m": "athlete_joshua-cisneros-m",
    "athlete_mica-galvao-m": "athlete_micael-galvao-m",
    "athlete_cyborg-abreu-m": "athlete_roberto-abreu-m",
}


def resolve_alias(athlete_id):
    return ATHLETE_ALIAS_MAP.get(athlete_id, athlete_id)


# --- Athletes ---
with open(athletes_csv) as f:
    athletes = list(csv.DictReader(f))

athletes_json = [
    {
        "canonicalAthleteId": a["canonical_athlete_id"],
        "name": a["name"],
        "sex": a["sex"],
        "primaryWeightClass": a["primary_weight_class"],
        "activeYearFirst": int(a["active_year_first"]),
        "activeYearLast": int(a["active_year_last"]),
        "totalMatches": int(a["total_matches"]),
        "nationality": a["nationality"] if a["nationality"].strip() else None,
        "team": a["team"] if a["team"].strip() else None,
    }
    for a in athletes
]

athlete_ids = {a["canonicalAthleteId"] for a in athletes_json}

athletes_out = os.path.join(out_dir, "adcc-athletes-enriched.json")
with open(athletes_out, "w") as f:
    json.dump(athletes_json, f, indent=2)
print(f"Athletes: {len(athletes_json)} records → {athletes_out}")

# --- Match mapping (merge with processed dataset for method/roundLabel) ---
with open(mapping_csv) as f:
    rows = list(csv.DictReader(f))

with open(processed_json) as f:
    processed = json.load(f)

# Build lookup from sourceMatchId → processed match (for method, roundLabel)
processed_by_source_id = {
    m["sourceMatchId"]: m
    for m in processed["normalized"]["matches"]
    if "sourceMatchId" in m
}

# --- Pre-2024 matches from CSV mapping ---
grouped = defaultdict(dict)
for row in rows:
    grouped[row["match_id"]][row["role"]] = row

matches_json = []
for match_id, roles in sorted(grouped.items(), key=lambda x: int(x[0])):
    winner = roles.get("winner")
    loser = roles.get("loser")
    if not winner or not loser:
        continue
    matches_json.append({
        "matchId": match_id,
        "winnerCanonicalId": winner["canonical_athlete_id"],
        "loserCanonicalId": loser["canonical_athlete_id"],
        "sex": winner["sex"],
        "weightClass": winner["weight_class"],
        "year": int(winner["year"]),
        "method": processed_by_source_id.get(match_id, {}).get("method"),
        "roundLabel": processed_by_source_id.get(match_id, {}).get("roundLabel"),
    })

csv_match_ids = set(grouped.keys())
print(f"Pre-2024 CSV matches: {len(matches_json)}")

# --- 2024 matches from processed.json (placement-derived edges) ---
added_2024 = 0
skipped_2024 = 0
for m in processed["normalized"]["matches"]:
    src_id = m.get("sourceMatchId", "")
    if "2024" not in src_id:
        continue
    if src_id in csv_match_ids:
        continue  # already covered by CSV

    winner_id = resolve_alias(m["winnerId"])
    loser_id = resolve_alias(m["loserId"])

    if winner_id not in athlete_ids or loser_id not in athlete_ids:
        skipped_2024 += 1
        continue

    matches_json.append({
        "matchId": src_id,
        "winnerCanonicalId": winner_id,
        "loserCanonicalId": loser_id,
        "sex": m.get("sex", ""),
        "weightClass": m.get("weightClass", ""),
        "year": 2024,
        "method": m.get("method"),
        "roundLabel": m.get("roundLabel"),
    })
    added_2024 += 1

print(f"2024 placement matches added: {added_2024} (skipped {skipped_2024} — athlete not in enriched set)")

# --- Update athlete metadata for 2024 participants ---
athletes_in_2024 = set()
for m in matches_json:
    if m["year"] == 2024:
        athletes_in_2024.add(m["winnerCanonicalId"])
        athletes_in_2024.add(m["loserCanonicalId"])

match_counts = defaultdict(int)
for m in matches_json:
    match_counts[m["winnerCanonicalId"]] += 1
    match_counts[m["loserCanonicalId"]] += 1

updated_athletes = 0
for a in athletes_json:
    aid = a["canonicalAthleteId"]
    if aid in athletes_in_2024 and a["activeYearLast"] < 2024:
        a["activeYearLast"] = 2024
        updated_athletes += 1
    a["totalMatches"] = match_counts.get(aid, a["totalMatches"])

# Re-write athletes with updated metadata
with open(athletes_out, "w") as f:
    json.dump(athletes_json, f, indent=2)
print(f"Updated {updated_athletes} athletes with activeYearLast=2024")

# --- Sort and write matches ---
def match_sort_key(m):
    """Sort by year, then by matchId (numeric first, then string for 2024 IDs)."""
    mid = m["matchId"]
    try:
        return (m["year"], 0, int(mid), "")
    except (ValueError, TypeError):
        return (m["year"], 1, 0, mid)

matches_json.sort(key=match_sort_key)

mapping_out = os.path.join(out_dir, "adcc-match-mapping.json")
with open(mapping_out, "w") as f:
    json.dump(matches_json, f, indent=2)
print(f"Total matches: {len(matches_json)} records → {mapping_out}")
