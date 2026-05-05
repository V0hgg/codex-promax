#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import signal
import threading
import time
import urllib.error
import urllib.request
import uuid
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

REQUEST_METRIC_NAME = "veloran_fixture_requests_total"
FAILURE_METRIC_NAME = "veloran_fixture_request_failures_total"
SERVICE_UP_METRIC_NAME = "veloran_fixture_service_up"
LAST_DURATION_METRIC_NAME = "veloran_fixture_last_request_duration_milliseconds"
LAST_REQUEST_TIME_METRIC_NAME = "veloran_fixture_last_request_unix_seconds"
LAST_STATUS_METRIC_NAME = "veloran_fixture_last_status_code"
DOWNSTREAM_REQUEST_METRIC_NAME = "veloran_fixture_downstream_requests_total"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Run a generic multi-service telemetry fixture for Veloran "
            "observability checks."
        ),
    )
    parser.add_argument("--runtime-dir", required=True)
    parser.add_argument("--trace-endpoint", required=True)
    parser.add_argument("--bind-host", default="0.0.0.0")
    return parser.parse_args()


@dataclass
class ServiceRuntime:
    name: str
    port: int
    log_path: Path
    downstream_port: int | None = None
    downstream_name: str | None = None
    request_count: int = 0
    failure_count: int = 0
    last_duration_ms: float = 0.0
    last_request_unix_seconds: float = 0.0
    last_status_code: int = 0
    downstream_request_counts: dict[str, int] = field(default_factory=dict)
    lock: threading.Lock = field(default_factory=threading.Lock)

    def record_request(
        self,
        *,
        success: bool,
        duration_ms: float,
        status_code: int,
        downstream_name: str | None,
    ) -> int:
        with self.lock:
            self.request_count += 1
            if not success:
                self.failure_count += 1
            if downstream_name is not None:
                self.downstream_request_counts[downstream_name] = (
                    self.downstream_request_counts.get(downstream_name, 0) + 1
                )
            self.last_duration_ms = duration_ms
            self.last_request_unix_seconds = time.time()
            self.last_status_code = status_code
            return self.request_count

    def snapshot(self) -> dict[str, object]:
        with self.lock:
            return {
                "request_count": self.request_count,
                "failure_count": self.failure_count,
                "last_duration_ms": self.last_duration_ms,
                "last_request_unix_seconds": self.last_request_unix_seconds,
                "last_status_code": self.last_status_code,
                "downstream_request_counts": dict(self.downstream_request_counts),
            }


class ReusableThreadingHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True


def append_log(
    log_path: Path,
    service_name: str,
    message: str,
    trace_id: str | None = None,
    visited: list[str] | None = None,
) -> None:
    log_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "service": service_name,
        "message": message,
    }
    if trace_id is not None:
        payload["trace_id"] = trace_id
    if visited is not None:
        payload["visited"] = visited

    with log_path.open("a", encoding="utf8") as handle:
        handle.write(json.dumps(payload) + "\n")


def build_metrics_body(service: ServiceRuntime) -> bytes:
    snapshot = service.snapshot()
    downstream_lines = []
    for downstream_name, count in sorted(snapshot["downstream_request_counts"].items()):
        downstream_lines.append(
            f'{DOWNSTREAM_REQUEST_METRIC_NAME}{{service="{service.name}",downstream="{downstream_name}"}} {count}',
        )

    body = "\n".join(
        [
            f"# HELP {REQUEST_METRIC_NAME} Chained request count for the Veloran fixture",
            f"# TYPE {REQUEST_METRIC_NAME} counter",
            f'{REQUEST_METRIC_NAME}{{service="{service.name}"}} {snapshot["request_count"]}',
            f"# HELP {FAILURE_METRIC_NAME} Failed chained request count for the Veloran fixture",
            f"# TYPE {FAILURE_METRIC_NAME} counter",
            f'{FAILURE_METRIC_NAME}{{service="{service.name}"}} {snapshot["failure_count"]}',
            f"# HELP {SERVICE_UP_METRIC_NAME} Service liveness for the Veloran fixture",
            f"# TYPE {SERVICE_UP_METRIC_NAME} gauge",
            f'{SERVICE_UP_METRIC_NAME}{{service="{service.name}"}} 1',
            f"# HELP {LAST_DURATION_METRIC_NAME} Duration in milliseconds for the last handled request",
            f"# TYPE {LAST_DURATION_METRIC_NAME} gauge",
            f'{LAST_DURATION_METRIC_NAME}{{service="{service.name}"}} {snapshot["last_duration_ms"]:.3f}',
            f"# HELP {LAST_REQUEST_TIME_METRIC_NAME} Unix timestamp for the last handled request",
            f"# TYPE {LAST_REQUEST_TIME_METRIC_NAME} gauge",
            f'{LAST_REQUEST_TIME_METRIC_NAME}{{service="{service.name}"}} {snapshot["last_request_unix_seconds"]:.3f}',
            f"# HELP {LAST_STATUS_METRIC_NAME} HTTP status code from the last handled request",
            f"# TYPE {LAST_STATUS_METRIC_NAME} gauge",
            f'{LAST_STATUS_METRIC_NAME}{{service="{service.name}"}} {snapshot["last_status_code"]}',
            f"# HELP {DOWNSTREAM_REQUEST_METRIC_NAME} Downstream requests emitted by the Veloran fixture",
            f"# TYPE {DOWNSTREAM_REQUEST_METRIC_NAME} counter",
            *downstream_lines,
            "",
        ],
    )
    return body.encode("utf8")


def send_span(
    trace_endpoint: str,
    service_name: str,
    trace_id: str,
    span_id: str,
    parent_span_id: str | None,
) -> None:
    start_nanos = int(time.time() * 1_000_000_000)
    end_nanos = start_nanos + 1_000_000

    span = {
        "traceId": trace_id,
        "spanId": span_id,
        "name": f"{service_name}.invoke",
        "kind": 1,
        "startTimeUnixNano": str(start_nanos),
        "endTimeUnixNano": str(end_nanos),
        "attributes": [
            {"key": "http.route", "value": {"stringValue": "/invoke"}},
            {"key": "fixture.chain", "value": {"stringValue": "gateway->workflow->data"}},
        ],
    }
    if parent_span_id:
        span["parentSpanId"] = parent_span_id

    payload = {
        "resourceSpans": [
            {
                "resource": {
                    "attributes": [
                        {
                            "key": "service.name",
                            "value": {"stringValue": service_name},
                        },
                    ],
                },
                "scopeSpans": [
                    {
                        "scope": {"name": "veloran-fixture"},
                        "spans": [span],
                    },
                ],
            },
        ],
    }

    request = urllib.request.Request(
        trace_endpoint,
        data=json.dumps(payload).encode("utf8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:  # noqa: S310
        response.read()


def call_downstream(port: int, trace_id: str, parent_span_id: str) -> list[str]:
    request = urllib.request.Request(
        f"http://127.0.0.1:{port}/invoke",
        headers={
            "x-trace-id": trace_id,
            "x-parent-span-id": parent_span_id,
        },
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=10) as response:  # noqa: S310
        body = json.loads(response.read().decode("utf8"))
    return list(body.get("visited", []))


def build_handler(service: ServiceRuntime, trace_endpoint: str):
    class ServiceHandler(BaseHTTPRequestHandler):
        def do_GET(self) -> None:  # noqa: N802
            if self.path == "/health":
                self._send_json(200, {"service": service.name, "status": "ok"})
                return

            if self.path == "/metrics":
                body = build_metrics_body(service)
                self.send_response(200)
                self.send_header("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return

            if self.path == "/invoke":
                trace_id = self.headers.get("x-trace-id") or uuid.uuid4().hex
                parent_span_id = self.headers.get("x-parent-span-id")
                span_id = uuid.uuid4().hex[:16]
                started = time.perf_counter()

                try:
                    downstream_visited: list[str] = []
                    if service.downstream_port is not None:
                        downstream_visited = call_downstream(
                            service.downstream_port,
                            trace_id,
                            span_id,
                        )

                    visited = [service.name, *downstream_visited]
                    append_log(
                        service.log_path,
                        service.name,
                        f"{service.name} handled /invoke",
                        trace_id,
                        visited,
                    )
                    send_span(trace_endpoint, service.name, trace_id, span_id, parent_span_id)
                    request_count = service.record_request(
                        success=True,
                        duration_ms=(time.perf_counter() - started) * 1000,
                        status_code=200,
                        downstream_name=service.downstream_name,
                    )
                    self._send_json(
                        200,
                        {
                            "service": service.name,
                            "request_count": request_count,
                            "trace_id": trace_id,
                            "visited": visited,
                        },
                    )
                    return
                except (TimeoutError, urllib.error.URLError) as error:
                    append_log(
                        service.log_path,
                        service.name,
                        f"{service.name} failed /invoke: {error}",
                        trace_id,
                        [service.name],
                    )
                    service.record_request(
                        success=False,
                        duration_ms=(time.perf_counter() - started) * 1000,
                        status_code=502,
                        downstream_name=service.downstream_name,
                    )
                    self._send_json(
                        502,
                        {
                            "service": service.name,
                            "error": str(error),
                            "trace_id": trace_id,
                        },
                    )
                    return

            self._send_json(404, {"service": service.name, "error": "not found"})

        def log_message(self, format: str, *args: object) -> None:  # noqa: A003
            return

        def _send_json(self, status: int, payload: dict[str, object]) -> None:
            body = json.dumps(payload).encode("utf8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    return ServiceHandler


def main() -> int:
    args = parse_args()
    runtime_dir = Path(args.runtime_dir)

    services = [
        ServiceRuntime(
            "gateway-api",
            9471,
            runtime_dir / "gateway-api.log",
            downstream_port=9472,
            downstream_name="workflow-api",
        ),
        ServiceRuntime(
            "workflow-api",
            9472,
            runtime_dir / "workflow-api.log",
            downstream_port=9473,
            downstream_name="data-api",
        ),
        ServiceRuntime("data-api", 9473, runtime_dir / "data-api.log"),
    ]

    servers: list[ReusableThreadingHTTPServer] = []
    threads: list[threading.Thread] = []
    stop_event = threading.Event()

    def handle_signal(_signum: int, _frame) -> None:
        stop_event.set()

    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    for service in services:
        append_log(service.log_path, service.name, f"{service.name} started on port {service.port}")
        server = ReusableThreadingHTTPServer(
            (args.bind_host, service.port),
            build_handler(service, args.trace_endpoint),
        )
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        servers.append(server)
        threads.append(thread)

    while not stop_event.is_set():
        stop_event.wait(0.5)

    for server in servers:
        server.shutdown()
        server.server_close()

    for thread in threads:
        thread.join(timeout=2)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
