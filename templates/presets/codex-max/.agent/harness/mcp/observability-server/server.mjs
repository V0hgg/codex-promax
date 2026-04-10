import { stdin, stdout, stderr } from "node:process";

const LOGS_URL = process.env.OBS_LOGS_URL ?? "http://127.0.0.1:9428";
const METRICS_URL = process.env.OBS_METRICS_URL ?? "http://127.0.0.1:8428";
const TRACES_URL = process.env.OBS_TRACES_URL ?? "http://127.0.0.1:10428";

const TOOLS = [
  {
    name: "query_logs",
    description: "Run a LogsQL query against local VictoriaLogs.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 500 },
      },
      required: ["query"],
    },
  },
  {
    name: "query_metrics",
    description: "Run a PromQL/MetricsQL query against local VictoriaMetrics.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "summarize_service_metrics",
    description:
      "List the service-labeled metric series currently visible for one service in local VictoriaMetrics.",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string" },
      },
      required: ["service"],
    },
  },
  {
    name: "query_traces",
    description:
      "Run a trace query against local VictoriaTraces. Accepts a raw query string or a service name for richer trace lookup.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        service: { type: "string" },
        operation: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 100 },
      },
    },
  },
  {
    name: "list_trace_services",
    description: "List traced service names currently visible in local VictoriaTraces.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_trace_operations",
    description: "List the operations currently visible for one traced service.",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string" },
      },
      required: ["service"],
    },
  },
  {
    name: "find_traces",
    description:
      "Return recent traces for one service, optionally filtered by operation, with a summarized span view.",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string" },
        operation: { type: "string" },
        limit: { type: "number", minimum: 1, maximum: 100 },
      },
      required: ["service"],
    },
  },
];

function writeMessage(message) {
  const payload = JSON.stringify(message);
  const framed = `Content-Length: ${Buffer.byteLength(payload, "utf8")}\r\n\r\n${payload}`;
  stdout.write(framed);
}

function asTextResult(text) {
  return { content: [{ type: "text", text }] };
}

function asJsonResult(payload) {
  return asTextResult(JSON.stringify(payload, null, 2));
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Failed to parse JSON from ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function encodePathSegment(value) {
  return encodeURIComponent(String(value));
}

function normalizeLimit(value, fallback = 20) {
  const numeric = Number(value ?? fallback);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(1, Math.min(100, Math.trunc(numeric)));
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

async function postForm(url, params) {
  const body = new URLSearchParams(params).toString();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${text}`);
  }

  return text;
}

async function postFormJson(url, params) {
  return parseJson(await postForm(url, params), url);
}

async function getText(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}: ${text}`);
  }
  return text;
}

async function getJson(url) {
  return parseJson(await getText(url), url);
}

function summarizeMetricSeries(resultRow) {
  const labels = { ...(resultRow.metric ?? {}) };
  const metricName = labels.__name__ ?? "unknown_metric";
  delete labels.__name__;

  return {
    metric: metricName,
    labels,
    timestamp: resultRow.value?.[0] ?? null,
    value: resultRow.value?.[1] ?? null,
  };
}

function summarizeSpan(span, serviceName) {
  const tagMap = Object.fromEntries((span.tags ?? []).map((tag) => [tag.key, tag.value]));

  return {
    span_id: span.spanID,
    parent_span_id: span.parentSpanId ?? null,
    service: serviceName,
    operation: span.operationName,
    start_time_unix_microseconds: span.startTime,
    duration_microseconds: span.duration,
    kind: tagMap["span.kind"] ?? null,
    http_route: tagMap["http.route"] ?? null,
    http_method: tagMap["http.method"] ?? null,
    http_status_code: tagMap["http.status_code"] ?? null,
  };
}

function summarizeTrace(trace) {
  const processMap = Object.fromEntries(
    Object.entries(trace.processes ?? {}).map(([processId, process]) => [processId, process.serviceName]),
  );

  const spans = (trace.spans ?? [])
    .map((span) => summarizeSpan(span, processMap[span.processID] ?? "unknown-service"))
    .sort((left, right) => Number(left.start_time_unix_microseconds) - Number(right.start_time_unix_microseconds));

  const rootSpans = spans.filter((span) => !span.parent_span_id);

  return {
    trace_id: trace.traceID,
    span_count: spans.length,
    service_names: uniqueSorted(spans.map((span) => span.service)),
    operation_names: uniqueSorted(spans.map((span) => span.operation)),
    root_spans: rootSpans,
    spans,
  };
}

async function queryLogs(args) {
  const limit = String(normalizeLimit(args.limit, 20));
  return postForm(`${LOGS_URL}/select/logsql/query`, { query: String(args.query), limit });
}

async function queryMetrics(args) {
  return postForm(`${METRICS_URL}/prometheus/api/v1/query`, { query: String(args.query) });
}

async function summarizeServiceMetrics(args) {
  const service = String(args.service);
  const result = await postFormJson(`${METRICS_URL}/prometheus/api/v1/query`, {
    query: `{service="${service}"}`,
  });
  const series = (result.data?.result ?? []).map(summarizeMetricSeries);

  return {
    service,
    total_series: series.length,
    metric_names: uniqueSorted(series.map((row) => row.metric)),
    series,
  };
}

async function listTraceServices() {
  const result = await getJson(`${TRACES_URL}/select/jaeger/api/services`);
  return {
    services: result.data ?? [],
    total: result.total ?? (result.data ?? []).length,
  };
}

async function listTraceOperations(args) {
  const service = String(args.service);
  const result = await getJson(
    `${TRACES_URL}/select/jaeger/api/services/${encodePathSegment(service)}/operations`,
  );

  return {
    service,
    operations: result.data ?? [],
    total: result.total ?? (result.data ?? []).length,
  };
}

async function findTraces(args) {
  const service = String(args.service);
  const params = new URLSearchParams({
    service,
    limit: String(normalizeLimit(args.limit, 10)),
  });

  if (args.operation) {
    params.set("operation", String(args.operation));
  }

  const result = await getJson(`${TRACES_URL}/select/jaeger/api/traces?${params.toString()}`);
  const traces = (result.data ?? []).map(summarizeTrace);

  return {
    service,
    operation: args.operation ? String(args.operation) : null,
    total: result.total ?? traces.length,
    traces,
  };
}

async function queryTraces(args) {
  if (args.service) {
    return asJsonResult(await findTraces(args));
  }

  if (!args.query) {
    throw new Error("query_traces requires either query or service.");
  }

  const query = String(args.query);
  const limit = String(normalizeLimit(args.limit, 20));
  const logsqlResponse = await postForm(`${TRACES_URL}/select/logsql/query`, { query, limit });
  if (logsqlResponse.includes(query)) {
    return asTextResult(logsqlResponse);
  }

  const servicesResponse = await getText(`${TRACES_URL}/select/jaeger/api/services`);
  if (servicesResponse.includes(query)) {
    return asTextResult(servicesResponse);
  }

  return asTextResult(logsqlResponse);
}

async function handleRequest(request) {
  if (request.method === "initialize") {
    return {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "observability-mcp-server",
        version: "0.0.1",
      },
    };
  }

  if (request.method === "tools/list") {
    return { tools: TOOLS };
  }

  if (request.method === "tools/call") {
    const name = request.params?.name;
    const args = request.params?.arguments ?? {};

    if (name === "query_logs") {
      return asTextResult(await queryLogs(args));
    }

    if (name === "query_metrics") {
      return asTextResult(await queryMetrics(args));
    }

    if (name === "summarize_service_metrics") {
      return asJsonResult(await summarizeServiceMetrics(args));
    }

    if (name === "query_traces") {
      return queryTraces(args);
    }

    if (name === "list_trace_services") {
      return asJsonResult(await listTraceServices());
    }

    if (name === "list_trace_operations") {
      return asJsonResult(await listTraceOperations(args));
    }

    if (name === "find_traces") {
      return asJsonResult(await findTraces(args));
    }

    throw new Error(`Unknown tool: ${name}`);
  }

  if (request.method === "notifications/initialized") {
    return null;
  }

  throw new Error(`Unsupported method: ${request.method}`);
}

let buffer = Buffer.alloc(0);

function tryReadFrame() {
  const headerEnd = buffer.indexOf("\r\n\r\n");
  if (headerEnd === -1) {
    return null;
  }

  const headerText = buffer.slice(0, headerEnd).toString("utf8");
  const contentLengthHeader = headerText
    .split("\r\n")
    .find((line) => line.toLowerCase().startsWith("content-length:"));

  if (!contentLengthHeader) {
    throw new Error("Missing Content-Length header");
  }

  const contentLength = Number(contentLengthHeader.split(":")[1].trim());
  const frameStart = headerEnd + 4;
  const frameEnd = frameStart + contentLength;

  if (buffer.length < frameEnd) {
    return null;
  }

  const json = buffer.slice(frameStart, frameEnd).toString("utf8");
  buffer = buffer.slice(frameEnd);

  return JSON.parse(json);
}

stdin.on("data", async (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);

  while (true) {
    let message;
    try {
      message = tryReadFrame();
    } catch (error) {
      stderr.write(`Failed to parse frame: ${String(error)}\n`);
      return;
    }

    if (!message) {
      break;
    }

    if (message.id === undefined) {
      continue;
    }

    try {
      const result = await handleRequest(message);
      writeMessage({ jsonrpc: "2.0", id: message.id, result });
    } catch (error) {
      writeMessage({
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32000,
          message: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }
});
