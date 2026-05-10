from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Future model modules are imported here so Alembic can discover metadata.
