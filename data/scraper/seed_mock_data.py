"""Seed script to load mock listings into PostgreSQL (optional).

Run with: python seed_mock_data.py --database-url postgresql+psycopg://user:pass@host:port/db
"""
from __future__ import annotations

import argparse
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine

DATA_PATH = Path(__file__).resolve().parents[1] / "raw" / "mock_listings.csv"


def seed(database_url: str) -> None:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    engine = create_engine(database_url)

    with engine.begin() as connection:
        df.to_sql("listings", connection, if_exists="replace", index=False)

    print("Seeded mock listings dataset to 'listings' table.")



def main() -> None:
    parser = argparse.ArgumentParser(description="Seed mock listings data into PostgreSQL")
    parser.add_argument("--database-url", dest="database_url", required=True, help="SQLAlchemy-compatible database URL")

    args = parser.parse_args()
    seed(args.database_url)


if __name__ == "__main__":
    main()
