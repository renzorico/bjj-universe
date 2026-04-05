import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SRC = BASE_DIR / "adcc_athletes_canonical.csv"
OUT = BASE_DIR / "adcc_athletes_pruned_2017.csv"

df = pd.read_csv(SRC)

# Ensure numeric
df["active_year_last"] = pd.to_numeric(df["active_year_last"], errors="coerce")
df["total_matches"] = pd.to_numeric(df["total_matches"], errors="coerce")

mask_drop = (df["total_matches"] == 1) & (df["active_year_last"] < 2017)
dropped = df[mask_drop]
kept = df[~mask_drop]

print("Total athletes:", len(df))
print("Dropped (1 match & last < 2017):", len(dropped))
print("Kept:", len(kept))

kept.to_csv(OUT, index=False)
print("Written:", OUT)
