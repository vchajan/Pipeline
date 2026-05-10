import os
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


os.environ["AUTH_MODE"] = "demo"
os.environ["DEMO_AUTH_ENABLED"] = "true"
os.environ["DATABASE_URL"] = ""
os.environ["SQLITE_DATABASE_URL"] = "sqlite:///./test_pipeline_monitor.db"
os.environ["REDIS_URL"] = ""

from app.api import deps  # noqa: E402
from app.db.base import Base, import_models  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture()
def db_session_factory() -> Generator[sessionmaker[Session], None, None]:
    import_models()
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    testing_session_factory = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        class_=Session,
    )

    try:
        yield testing_session_factory
    finally:
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def db_session(db_session_factory: sessionmaker[Session]) -> Generator[Session, None, None]:
    db = db_session_factory()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[deps.get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
