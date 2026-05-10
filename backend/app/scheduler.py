import logging
import os
from time import sleep

from app.core.config import get_settings
from app.db.session import SessionLocal
from app.services.scheduler_service import run_scheduler_tick


logger = logging.getLogger(__name__)


def main() -> None:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    settings = get_settings()
    interval = max(1, settings.scheduler_interval_seconds)

    logger.info(
        "Starting scheduler %s with %ss interval",
        settings.scheduler_id,
        interval,
    )

    while True:
        try:
            with SessionLocal() as db:
                created_runs = run_scheduler_tick(db)
            logger.info("Scheduler tick complete; created_runs=%s", created_runs)
        except Exception:
            logger.exception("Scheduler tick crashed; retrying after interval")

        sleep(interval)


if __name__ == "__main__":
    main()
