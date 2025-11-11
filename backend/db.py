import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


@lru_cache
def get_database_url() -> str:
    url = os.getenv("POSTGRES_URL")
    if not url:
        raise RuntimeError("POSTGRES_URL environment variable is not set.")
    return url


def get_engine():
    return create_engine(get_database_url(), future=True)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=get_engine())

