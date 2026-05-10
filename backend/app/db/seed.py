from sqlalchemy.orm import Session

from app.db.session import SessionLocal


def seed_database(db: Session) -> None:
    """Placeholder for demo data added in later phases."""
    return None


def main() -> None:
    with SessionLocal() as db:
        seed_database(db)


if __name__ == "__main__":
    main()
