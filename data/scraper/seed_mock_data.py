import csv
import os
from pathlib import Path

import psycopg

DATA_FILE = Path(__file__).resolve().parents[1] / "raw" / "mock_listings.csv"


def get_connection():
    url = os.getenv("POSTGRES_URL")
    if not url:
        raise RuntimeError("POSTGRES_URL environment variable is not set.")
    return psycopg.connect(url, autocommit=True)


def seed():
    with get_connection() as conn, conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS listings (
                id SERIAL PRIMARY KEY,
                city TEXT,
                district TEXT,
                neighbourhood TEXT,
                property_type TEXT,
                size_m2 NUMERIC,
                rooms INTEGER,
                building_age INTEGER,
                listing_type TEXT,
                price NUMERIC,
                rent NUMERIC,
                listing_date DATE
            )
            """
        )
        cur.execute("TRUNCATE TABLE listings;")

        with DATA_FILE.open("r", encoding="utf-8") as file:
            reader = csv.DictReader(file)
            rows = [
                (
                    row["city"],
                    row["district"],
                    row["neighbourhood"],
                    row["property_type"],
                    float(row["size_m2"]),
                    int(row["rooms"]),
                    int(row["building_age"]),
                    row["listing_type"],
                    float(row["price"]) if row["price"] else None,
                    float(row["rent"]) if row["rent"] else None,
                    row["listing_date"],
                )
                for row in reader
            ]

        cur.executemany(
            """
            INSERT INTO listings (
                city,
                district,
                neighbourhood,
                property_type,
                size_m2,
                rooms,
                building_age,
                listing_type,
                price,
                rent,
                listing_date
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            rows,
        )
        print(f"Seeded {len(rows)} listings into the database.")


if __name__ == "__main__":
    seed()

