import unicodedata
import re
from pathlib import Path
from collections import Counter

import pandas as pd

try:
    from fuzzywuzzy import fuzz
    USE_FUZZ = True
except ImportError:
    USE_FUZZ = False

BASE_DIR = Path(__file__).resolve().parent
RAW_PATH = BASE_DIR / "adcc_historical_data.csv"
ALIAS_MAP_PATH = BASE_DIR / "adcc_manual_alias_map.csv"


def normalize_name(name: str) -> str:
    if not isinstance(name, str) or not name:
        return ""
    name_norm = unicodedata.normalize("NFKD", name)
    name_norm = "".join(ch for ch in name_norm if not unicodedata.combining(ch))
    name_norm = re.sub(r"[^\w\s]", "", name_norm)
    name_norm = re.sub(r"\s+", " ", name_norm).strip().lower()
    return "-".join(name_norm.split())


def derive_sex(values):
    unique_vals = {v.upper() for v in values if isinstance(v, str) and v.strip()}
    if not unique_vals:
        return "U"
    if len(unique_vals) == 1:
        val = next(iter(unique_vals))
        return val if val in {"M", "F"} else "U"
    return "U"


def load_alias_map(path: Path = ALIAS_MAP_PATH):
    if not path.exists():
        return {}
    df = pd.read_csv(path)
    required = {"alias_name", "canonical_name", "action"}
    if not required.issubset(df.columns):
        raise ValueError(f"Alias map must contain columns: {sorted(required)}")
    df = df[df["action"] == "merge_alias"].copy()
    df["alias_name"] = df["alias_name"].astype(str).str.strip()
    df["canonical_name"] = df["canonical_name"].astype(str).str.strip()
    return dict(zip(df["alias_name"], df["canonical_name"]))


def apply_alias(name: str, alias_map: dict) -> str:
    if not isinstance(name, str):
        return ""
    name = name.strip()
    return alias_map.get(name, name)


def build_canonical_athletes(matches: pd.DataFrame, alias_map: dict):
    rows = []
    for _, row in matches.iterrows():
        winner_mapped = apply_alias(row["winner_name"], alias_map)
        loser_mapped = apply_alias(row["loser_name"], alias_map)

        rows.append({
            "match_id": row["match_id"],
            "role": "winner",
            "raw_name": row["winner_name"],
            "mapped_name": winner_mapped,
            "sex": row["sex"],
            "weight_class": row["weight_class"],
            "year": row["year"],
        })
        rows.append({
            "match_id": row["match_id"],
            "role": "loser",
            "raw_name": row["loser_name"],
            "mapped_name": loser_mapped,
            "sex": row["sex"],
            "weight_class": row["weight_class"],
            "year": row["year"],
        })

    athletes_raw = pd.DataFrame(rows)

    # CRITICAL: slug must come from mapped_name, not raw_name
    athletes_raw["slug"] = athletes_raw["mapped_name"].apply(normalize_name)

    canonical_records = []
    for slug, group in athletes_raw.groupby("slug"):
        names = group["mapped_name"].dropna().tolist()
        name_counts = Counter(names)
        canonical_name = sorted(name_counts.items(), key=lambda x: (-x[1], x[0]))[0][0]
        sex = derive_sex(group["sex"].dropna().tolist())

        weight_values = group["weight_class"].dropna().tolist()
        primary_weight = None
        if weight_values:
            wt_counts = Counter(weight_values)
            primary_weight = sorted(wt_counts.items(), key=lambda x: (-x[1], x[0]))[0][0]

        years = pd.to_numeric(group["year"], errors="coerce").dropna().astype(int).tolist()
        active_first = min(years) if years else None
        active_last = max(years) if years else None
        total_matches = len(group)
        sex_suffix = sex.lower() if sex in {"M", "F"} else "u"
        canonical_id = f"athlete_{slug}-{sex_suffix}"

        canonical_records.append({
            "canonical_athlete_id": canonical_id,
            "slug": slug,
            "name": canonical_name,
            "sex": sex,
            "primary_weight_class": primary_weight,
            "active_year_first": active_first,
            "active_year_last": active_last,
            "total_matches": total_matches,
        })

    athletes_df = pd.DataFrame(canonical_records).sort_values(
        ["total_matches", "active_year_last", "name"],
        ascending=[False, False, True]
    )

    slug_to_id = dict(zip(athletes_df["slug"], athletes_df["canonical_athlete_id"]))
    athletes_raw["canonical_athlete_id"] = athletes_raw["slug"].map(slug_to_id)

    mapping_df = athletes_raw[
        ["match_id", "role", "raw_name", "mapped_name", "canonical_athlete_id", "sex", "weight_class", "year"]
    ]

    return athletes_df, mapping_df


def build_alias_review_table(athletes_df: pd.DataFrame, threshold: int = 85) -> pd.DataFrame:
    suggestions = []
    names = athletes_df["name"].tolist()
    ids = athletes_df["canonical_athlete_id"].tolist()
    n = len(names)

    for i in range(n):
        for j in range(i + 1, n):
            if ids[i] == ids[j]:
                continue
            if USE_FUZZ:
                similarity = fuzz.ratio(names[i], names[j])
            else:
                set_i = set(names[i].lower().split())
                set_j = set(names[j].lower().split())
                common = len(set_i & set_j)
                total = max(len(set_i), len(set_j))
                similarity = int(100 * common / total) if total else 0
            if similarity >= threshold:
                suggestions.append({
                    "name1": names[i],
                    "id1": ids[i],
                    "name2": names[j],
                    "id2": ids[j],
                    "similarity": similarity,
                })

    if suggestions:
        return pd.DataFrame(suggestions).sort_values(
            ["similarity", "name1", "name2"],
            ascending=[False, True, True]
        )

    return pd.DataFrame(columns=["name1", "id1", "name2", "id2", "similarity"])


def build_pruning_scenarios(athletes_df: pd.DataFrame, cutoff_years):
    records = []
    for cutoff in cutoff_years:
        to_remove = athletes_df[
            (athletes_df["total_matches"] == 1) &
            (athletes_df["active_year_last"] < cutoff)
        ]
        removed = len(to_remove)
        kept = len(athletes_df) - removed
        records.append({
            "cutoff_year": cutoff,
            "remove_rule": "total_matches = 1 and active_year_last < cutoff_year",
            "removed_count": removed,
            "kept_count": kept,
        })
    return pd.DataFrame(records)


def build_anomalies_table(athletes_df: pd.DataFrame):
    anomalies = []
    if athletes_df.empty:
        return pd.DataFrame(columns=list(athletes_df.columns) + ["anomaly_reason"])

    counts = athletes_df["total_matches"].sort_values(ascending=False).reset_index(drop=True)
    threshold_index = max(int(len(counts) * 0.01), 1) - 1
    high_count_threshold = counts.iloc[threshold_index]

    for _, row in athletes_df.iterrows():
        reasons = []
        if row["sex"] == "U":
            reasons.append("ambiguous_sex")
        if pd.notna(row["active_year_first"]) and pd.notna(row["active_year_last"]) and row["active_year_last"] < row["active_year_first"]:
            reasons.append("year_span_reversed")
        if pd.notna(row["active_year_first"]) and pd.notna(row["active_year_last"]) and (row["active_year_last"] - row["active_year_first"] > 25):
            reasons.append("long_career_span")
        if row["total_matches"] >= high_count_threshold:
            reasons.append("high_match_count")
        if reasons:
            anomalies.append({**row.to_dict(), "anomaly_reason": ",".join(reasons)})

    return pd.DataFrame(anomalies).sort_values(
        ["total_matches", "active_year_last", "name"],
        ascending=[False, False, True]
    )


def main():
    if not RAW_PATH.exists():
        raise FileNotFoundError(f"Raw file not found: {RAW_PATH}")

    matches = pd.read_csv(RAW_PATH, sep=";")
    expected = {
        "match_id", "winner_id", "winner_name", "loser_id", "loser_name", "win_type",
        "submission", "winner_points", "loser_points", "adv_pen", "weight_class", "sex", "stage", "year"
    }
    missing = expected - set(matches.columns)
    if missing:
        raise ValueError(f"Missing expected columns: {sorted(missing)}")

    alias_map = load_alias_map()
    athletes_df, mapping_df = build_canonical_athletes(matches, alias_map)
    alias_df = build_alias_review_table(athletes_df, threshold=85)
    pruning_df = build_pruning_scenarios(athletes_df, cutoff_years=[2013, 2015, 2017, 2019])
    anomalies_df = build_anomalies_table(athletes_df)

    athletes_df.drop(columns=["slug"]).to_csv(BASE_DIR / "adcc_athletes_canonical.csv", index=False)
    mapping_df.to_csv(BASE_DIR / "adcc_match_athlete_mapping.csv", index=False)
    alias_df.to_csv(BASE_DIR / "adcc_alias_review.csv", index=False)
    pruning_df.to_csv(BASE_DIR / "adcc_pruning_scenarios.csv", index=False)
    anomalies_df.to_csv(BASE_DIR / "adcc_anomalies_review.csv", index=False)

    print("Done. Files written to:")
    print(f"- {BASE_DIR / 'adcc_athletes_canonical.csv'}")
    print(f"- {BASE_DIR / 'adcc_match_athlete_mapping.csv'}")
    print(f"- {BASE_DIR / 'adcc_alias_review.csv'}")
    print(f"- {BASE_DIR / 'adcc_pruning_scenarios.csv'}")
    print(f"- {BASE_DIR / 'adcc_anomalies_review.csv'}")


if __name__ == "__main__":
    main()
