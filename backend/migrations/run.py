"""Apply pending SQL migrations from this directory in numeric filename order.

Tracks applied migrations in a `schema_migrations` table. Each .sql file is
executed in a single transaction; partial application aborts and rolls back.

Usage:
    python -m migrations.run               # apply all pending
    python -m migrations.run --status      # list applied + pending
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

import psycopg

from config import settings


MIGRATIONS_DIR = Path(__file__).parent


def _list_files() -> list[Path]:
    return sorted(p for p in MIGRATIONS_DIR.glob("*.sql"))


def _ensure_table(conn: psycopg.Connection) -> None:
    with conn.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
    conn.commit()


def _applied(conn: psycopg.Connection) -> set[str]:
    with conn.cursor() as cur:
        cur.execute("SELECT filename FROM schema_migrations")
        return {row[0] for row in cur.fetchall()}


def apply_pending(verbose: bool = True) -> list[str]:
    """Apply any unapplied migration files. Returns the list applied this run."""
    if not settings.DATABASE_URL:
        if verbose:
            print("[migrations] DATABASE_URL not set; skipping")
        return []

    applied_now: list[str] = []
    with psycopg.connect(settings.DATABASE_URL, autocommit=False) as conn:
        _ensure_table(conn)
        already = _applied(conn)

        for path in _list_files():
            name = path.name
            if name in already:
                continue
            sql = path.read_text()
            if verbose:
                print(f"[migrations] applying {name}")
            try:
                with conn.cursor() as cur:
                    cur.execute(sql)
                    cur.execute(
                        "INSERT INTO schema_migrations (filename) VALUES (%s)",
                        (name,),
                    )
                conn.commit()
                applied_now.append(name)
            except Exception as e:
                conn.rollback()
                raise RuntimeError(f"Migration {name} failed: {e}") from e

    if verbose:
        if applied_now:
            print(f"[migrations] applied {len(applied_now)} migration(s)")
        else:
            print("[migrations] no pending migrations")
    return applied_now


def print_status() -> None:
    if not settings.DATABASE_URL:
        print("DATABASE_URL not set")
        return
    with psycopg.connect(settings.DATABASE_URL) as conn:
        _ensure_table(conn)
        already = _applied(conn)
    files = [p.name for p in _list_files()]
    print(f"{'STATUS':<10} FILE")
    for name in files:
        print(f"{'applied' if name in already else 'pending':<10} {name}")


if __name__ == "__main__":
    if "--status" in sys.argv:
        print_status()
    else:
        apply_pending()
