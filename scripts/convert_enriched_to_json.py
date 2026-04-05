#!/usr/bin/env python3
"""Convert the enriched athlete CSV and match mapping CSV to JSON for runtime use."""

import csv
import json
import os
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

athletes_csv = os.path.join(BASE, "data/processed/adcc/adcc_athletes_final.csv")
mapping_csv = os.path.join(BASE, "scripts/adcc_match_athlete_mapping.csv")
processed_json = os.path.join(BASE, "src/data/processed/adcc-historical.processed.json")
out_dir = os.path.join(BASE, "src/data/processed")

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

athlete_ids = {a["canonicalAthleteId"] for a in athletes_json}

# Group by match_id
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

matches_json.sort(key=lambda m: (m["year"], int(m["matchId"])))

mapping_out = os.path.join(out_dir, "adcc-match-mapping.json")
with open(mapping_out, "w") as f:
    json.dump(matches_json, f, indent=2)
print(f"Matches: {len(matches_json)} records → {mapping_out}")
