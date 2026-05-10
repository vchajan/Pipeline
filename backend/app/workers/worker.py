import logging
import os

from rq import Worker

from app.core.config import get_settings
from app.workers.queue import get_pipeline_queue, get_redis_connection


def main() -> None:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO"),
        format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    )
    settings = get_settings()
    connection = get_redis_connection()
    queue = get_pipeline_queue()
    worker_name = os.getenv("WORKER_ID", "local-worker")

    logging.getLogger(__name__).info(
        "Starting RQ worker %s for queue %s",
        worker_name,
        settings.rq_queue_name,
    )
    worker = Worker([queue], connection=connection, name=worker_name)
    worker.work(with_scheduler=False)


if __name__ == "__main__":
    main()
