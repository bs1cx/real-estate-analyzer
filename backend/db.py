from __future__ import annotations

import os
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


@lru_cache
def get_database_url() -> str:
    url = os.getenv("POSTGRES_URL")
    if not url:
        raise RuntimeError("POSTGRES_URL environment variable is not set")
    return url


def create_session_factory(echo: bool = False):
    engine = create_engine(get_database_url(), echo=echo, future=True)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)


SessionLocal = create_session_factory()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
