from redis import Redis
from rq import Queue

from app.core.config import get_settings


def get_redis_connection() -> Redis:
    settings = get_settings()
    if not settings.redis_url:
        raise RuntimeError("REDIS_URL is required to enqueue pipeline runs")
    return Redis.from_url(settings.redis_url)


def get_pipeline_queue() -> Queue:
    settings = get_settings()
    return Queue(settings.rq_queue_name, connection=get_redis_connection())


def enqueue_pipeline_run(run_id: int) -> str:
    from app.workers.pipeline_jobs import process_pipeline_run

    queue = get_pipeline_queue()
    job = queue.enqueue(process_pipeline_run, run_id, job_timeout=600)
    return job.id
