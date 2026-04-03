from __future__ import annotations

import shutil
from pathlib import Path


DATASET = "bjagrelli/adcc-historical-dataset"
CSV_NAME = "adcc_historical_data.csv"


def main() -> None:
    try:
        import kagglehub
    except ImportError as exc:  # pragma: no cover
        raise SystemExit(
            "kagglehub is required for automated download. "
            "Install it with `python3 -m pip install kagglehub`."
        ) from exc

    dataset_path = Path(kagglehub.dataset_download(DATASET))
    source_csv = dataset_path / CSV_NAME

    if not source_csv.exists():
        raise SystemExit(f"Expected CSV not found at {source_csv}")

    destination = Path("data/raw/adcc") / CSV_NAME
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source_csv, destination)

    print(f"Downloaded {DATASET}")
    print(f"Copied {source_csv} -> {destination}")


if __name__ == "__main__":
    main()
