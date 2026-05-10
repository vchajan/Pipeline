"""End-to-end smoke test for the local Pipeline Monitor stack.

The script talks to the running backend API, creates a deterministic failing
pipeline run, waits for the worker to finish it, and verifies that an alert was
created. It uses only the Python standard library.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import uuid
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ADMIN_HEADERS = {"X-Demo-User-Id": "1"}
OPERATOR_HEADERS = {"X-Demo-User-Id": "2"}
TERMINAL_STATUSES = {"success", "failed", "cancelled"}


def main() -> int:
    args = parse_args()
    api_base = args.api_base.rstrip("/")
    health_base = (args.health_base or infer_health_base(api_base)).rstrip("/")

    try:
        log("Checking backend health")
        health = request_json("GET", f"{health_base}/health")
        expect(health.get("status") == "ok", f"Unexpected health response: {health}")

        log("Checking backend readiness")
        readiness = request_json("GET", f"{health_base}/ready")
        expect(readiness.get("status") == "ready", f"Backend is not ready: {readiness}")

        suffix = uuid.uuid4().hex[:8]
        dataset = create_dataset(api_base, suffix)
        pipeline = create_pipeline(api_base, dataset["id"], suffix)
        create_failing_version(api_base, pipeline["id"])
        create_alert_rule(api_base, pipeline["id"], suffix)
        run = start_pipeline_run(api_base, pipeline["id"])

        completed_run = wait_for_run(
            api_base=api_base,
            run_id=run["id"],
            timeout_seconds=args.timeout,
            poll_interval_seconds=args.poll_interval,
        )
        expect(
            completed_run["status"] == "failed",
            f"Expected deterministic failed run, got {completed_run['status']}",
        )

        log("Verifying run details are retrievable")
        run_detail = request_json(
            "GET",
            f"{api_base}/runs/{run['id']}",
            headers=OPERATOR_HEADERS,
        )
        expect(run_detail["id"] == run["id"], "Run detail id did not match created run")

        log("Verifying alert was created")
        alerts = request_json("GET", f"{api_base}/alerts", headers=OPERATOR_HEADERS)
        matching_alerts = [alert for alert in alerts if alert.get("run_id") == run["id"]]
        expect(matching_alerts, "Expected at least one alert for deterministic failed run")
        expect(
            matching_alerts[0]["status"] in {"open", "acknowledged", "resolved"},
            f"Unexpected alert status: {matching_alerts[0]}",
        )

        log("Smoke test passed")
        return 0
    except SmokeTestError as exc:
        print(f"SMOKE TEST FAILED: {exc}", file=sys.stderr)
        return 1
    except (HTTPError, URLError) as exc:
        print(f"SMOKE TEST FAILED: API request failed: {exc}", file=sys.stderr)
        return 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Pipeline Monitor smoke test.")
    parser.add_argument(
        "--api-base",
        default="http://localhost:8000",
        help="Base API URL. Use http://localhost:8088/api when testing through Nginx.",
    )
    parser.add_argument(
        "--health-base",
        default=None,
        help="Base URL for /health and /ready. Defaults to api-base, or api-base without /api.",
    )
    parser.add_argument("--timeout", type=int, default=120, help="Seconds to wait for run completion.")
    parser.add_argument("--poll-interval", type=float, default=2.0, help="Seconds between run polls.")
    return parser.parse_args()


def infer_health_base(api_base: str) -> str:
    return api_base[:-4] if api_base.endswith("/api") else api_base


def create_dataset(api_base: str, suffix: str) -> dict[str, Any]:
    log("Creating dataset")
    return request_json(
        "POST",
        f"{api_base}/datasets",
        headers=ADMIN_HEADERS,
        body={
            "name": f"Smoke Dataset {suffix}",
            "description": "Created by infra/smoke_test.py",
            "owner": "Smoke Test",
            "source_type": "csv_file",
            "schema_version": "v1",
        },
    )


def create_pipeline(api_base: str, dataset_id: int, suffix: str) -> dict[str, Any]:
    log("Creating pipeline")
    return request_json(
        "POST",
        f"{api_base}/pipelines",
        headers=ADMIN_HEADERS,
        body={
            "dataset_id": dataset_id,
            "name": f"Smoke Pipeline {suffix}",
            "description": "Deterministic failing smoke-test pipeline",
            "schedule": None,
            "active": True,
            "engine": "python",
            "processing_mode": "batch",
            "load_type": "incremental",
            "target_layer": "l1_clean",
        },
    )


def create_failing_version(api_base: str, pipeline_id: int) -> dict[str, Any]:
    log("Creating active deterministic failing pipeline version")
    return request_json(
        "POST",
        f"{api_base}/pipelines/{pipeline_id}/versions",
        headers=ADMIN_HEADERS,
        body={
            "version_number": 1,
            "active": True,
            "config_json": {
                "force_failure": True,
                "fail_step": "transform",
                "runtime_seconds": 5,
                "records_processed": 100,
                "step_sleep_seconds": 0,
            },
        },
    )


def create_alert_rule(api_base: str, pipeline_id: int, suffix: str) -> dict[str, Any]:
    log("Creating alert rule")
    return request_json(
        "POST",
        f"{api_base}/alert-rules",
        headers=ADMIN_HEADERS,
        body={
            "pipeline_id": pipeline_id,
            "name": f"Smoke run failed {suffix}",
            "condition_type": "run_failed",
            "threshold_seconds": None,
            "threshold_records": None,
            "enabled": True,
        },
    )


def start_pipeline_run(api_base: str, pipeline_id: int) -> dict[str, Any]:
    log("Starting pipeline run")
    run = request_json(
        "POST",
        f"{api_base}/pipelines/{pipeline_id}/run",
        headers=OPERATOR_HEADERS,
        body={"trigger_type": "manual"},
    )
    expect(run["status"] == "queued", f"Expected queued run, got {run['status']}")
    return run


def wait_for_run(
    api_base: str,
    run_id: int,
    timeout_seconds: int,
    poll_interval_seconds: float,
) -> dict[str, Any]:
    log(f"Waiting for run {run_id} to complete")
    deadline = time.monotonic() + timeout_seconds
    last_run: dict[str, Any] | None = None

    while time.monotonic() < deadline:
        last_run = request_json(
            "GET",
            f"{api_base}/runs/{run_id}",
            headers=OPERATOR_HEADERS,
        )
        status = last_run["status"]
        log(f"Run {run_id} status: {status}")
        if status in TERMINAL_STATUSES:
            return last_run
        time.sleep(poll_interval_seconds)

    raise SmokeTestError(f"Run {run_id} did not complete before timeout. Last run: {last_run}")


def request_json(
    method: str,
    url: str,
    headers: dict[str, str] | None = None,
    body: dict[str, Any] | None = None,
) -> Any:
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    request_headers = {"Accept": "application/json"}
    if body is not None:
        request_headers["Content-Type"] = "application/json"
    request_headers.update(headers or {})

    request = Request(url=url, method=method, data=payload, headers=request_headers)
    with urlopen(request, timeout=10) as response:
        response_body = response.read()
        if not response_body:
            return None
        return json.loads(response_body.decode("utf-8"))


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise SmokeTestError(message)


def log(message: str) -> None:
    print(f"[smoke] {message}")


class SmokeTestError(Exception):
    pass


if __name__ == "__main__":
    raise SystemExit(main())
