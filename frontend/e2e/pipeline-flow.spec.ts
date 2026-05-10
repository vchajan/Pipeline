import { expect, test, type Page, type Route } from "@playwright/test";

test("demo user can create and monitor a simulated pipeline", async ({ page }) => {
  await installApiMock(page);

  await page.goto("/");
  await expect(page.getByText("Demo Admin - admin")).toBeVisible();

  await page.getByRole("link", { name: "Datasets" }).click();
  await page.getByLabel("Name").fill("Orders");
  await page.getByLabel("Owner").fill("Data Team");
  await page.getByLabel("Schema version").fill("v1");
  await page.getByRole("button", { name: "Create dataset" }).click();
  await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();

  await page.getByRole("link", { name: "Pipelines" }).click();

await page.getByLabel("Dataset").selectOption("1");
await expect(page.getByRole("button", { name: "Create pipeline" })).toBeEnabled();

await page.getByLabel("Name").fill("Orders daily load");
await page.getByLabel("Schedule").fill("*/15 * * * *");
await page.getByRole("button", { name: "Create pipeline" }).click();

await expect(page.getByRole("link", { name: "Orders daily load" })).toBeVisible();

  await page.getByRole("link", { name: "Alert Rules" }).click();
  await page.getByLabel("Name").fill("Run failed");
  await page.getByLabel("Condition").selectOption("run_failed");
  await page.getByRole("button", { name: "Create rule" }).click();
  await expect(page.getByLabel("Name")).toHaveValue("");
  await expect(
  page.locator("tbody").getByText("Run failed", { exact: true }),
).toBeVisible();

  await page.getByRole("button", { name: "Operator" }).click();
  await page.getByRole("link", { name: "Pipelines" }).click();
  await page.getByRole("link", { name: "Orders daily load" }).click();
  await page.getByRole("button", { name: /run pipeline/i }).click();

  await page.getByRole("link", { name: "#1" }).first().click();
  await expect(page.getByRole("heading", { name: "Run #1" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "ETL Steps" })).toBeVisible();

  await page.getByRole("link", { name: "Alerts" }).click();
  await page.getByRole("link", { name: "#1" }).click();
  await expect(page.getByRole("heading", { name: "Alert #1" })).toBeVisible();
  await page.getByRole("button", { name: "Acknowledge" }).click();
  await expect(page.getByText("acknowledged")).toBeVisible();
  await page.getByRole("button", { name: "Resolve" }).click();
  await expect(page.locator('span.status-badge').getByText('resolved')).toBeVisible();
});

async function installApiMock(page: Page) {
  const users = {
    "1": userFixture(1, "admin"),
    "2": userFixture(2, "operator"),
    "3": userFixture(3, "viewer"),
  };
  const datasets: DatasetPayload[] = [];
  const pipelines: PipelinePayload[] = [];
  const alertRules: AlertRulePayload[] = [];
  const runs: RunPayload[] = [];
  const alerts: AlertPayload[] = [];

  await page.route("http://localhost:5173/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const demoUserId = request.headers()["x-demo-user-id"] ?? "1";

    const isApiRequest = url.pathname.startsWith("/api/") || url.pathname === "/auth/me";

    if (!isApiRequest) {
      return route.continue();
    }

    const path = url.pathname.replace(/^\/api/, "");

    if (path === "/auth/me" && method === "GET") {
      return fulfill(route, users[demoUserId as keyof typeof users] ?? users["1"]);
    }

    if (path === "/dashboard/summary" && method === "GET") {
      return fulfill(route, {
        datasets_count: datasets.length,
        pipelines_count: pipelines.length,
        active_pipelines_count: pipelines.filter((pipeline) => pipeline.active).length,
        runs_count: runs.length,
        open_alerts_count: alerts.filter((alert) => alert.status !== "resolved").length,
        runs_by_status: runs.reduce<Record<string, number>>((counts, run) => {
          counts[run.status] = (counts[run.status] ?? 0) + 1;
          return counts;
        }, {}),
      });
    }

    if (path === "/system/status" && method === "GET") {
      return fulfill(route, { database: "ok", workers: [], scheduler: null });
    }

    if (path === "/datasets" && method === "GET") {
      return fulfill(route, datasets);
    }

    if (path === "/datasets" && method === "POST") {
      const body = await request.postDataJSON();
      const dataset = {
        id: datasets.length + 1,
        created_at: now(),
        updated_at: now(),
        ...body,
      };
      datasets.push(dataset);
      return fulfill(route, dataset, 201);
    }

    if (path === "/pipelines" && method === "GET") {
      return fulfill(route, pipelines);
    }

    if (path === "/pipelines" && method === "POST") {
      const body = await request.postDataJSON();
      const pipeline = {
        id: pipelines.length + 1,
        created_at: now(),
        updated_at: now(),
        ...body,
      };
      pipelines.push(pipeline);
      return fulfill(route, pipeline, 201);
    }

    const pipelineMatch = path.match(/^\/pipelines\/(\d+)$/);
    if (pipelineMatch && method === "GET") {
      return fulfill(route, pipelines.find((pipeline) => pipeline.id === Number(pipelineMatch[1])));
    }

    const pipelineRunsMatch = path.match(/^\/pipelines\/(\d+)\/runs$/);
    if (pipelineRunsMatch && method === "GET") {
      const pipelineId = Number(pipelineRunsMatch[1]);
      return fulfill(route, runs.filter((run) => run.pipeline_id === pipelineId));
    }

    const pipelineAlertsMatch = path.match(/^\/pipelines\/(\d+)\/alerts$/);
    if (pipelineAlertsMatch && method === "GET") {
      const pipelineId = Number(pipelineAlertsMatch[1]);
      return fulfill(route, alerts.filter((alert) => alert.pipeline_id === pipelineId));
    }

    const pipelineVersionsMatch = path.match(/^\/pipelines\/(\d+)\/versions$/);
    if (pipelineVersionsMatch && method === "GET") {
      return fulfill(route, []);
    }

    const pipelineRunMatch = path.match(/^\/pipelines\/(\d+)\/run$/);
    if (pipelineRunMatch && method === "POST") {
      const pipelineId = Number(pipelineRunMatch[1]);
      const run = {
        id: runs.length + 1,
        pipeline_id: pipelineId,
        pipeline_version_id: null,
        trigger_type: "manual",
        status: "failed",
        started_at: now(),
        finished_at: now(),
        runtime_seconds: 5,
        records_processed: 100,
        error_message: "Simulated e2e failure",
        created_by: Number(demoUserId),
        created_at: now(),
      };
      runs.unshift(run);

      const matchingRule = alertRules.find((rule) => rule.pipeline_id === pipelineId);
      if (matchingRule) {
        alerts.unshift({
          id: alerts.length + 1,
          rule_id: matchingRule.id,
          run_id: run.id,
          pipeline_id: pipelineId,
          message: `Run ${run.id} failed for pipeline ${pipelineId}`,
          severity: "high",
          status: "open",
          created_at: now(),
          acknowledged_at: null,
          resolved_at: null,
          acknowledged_by: null,
          resolved_by: null,
        });
      }

      return fulfill(route, run, 201);
    }

    if (path === "/runs" && method === "GET") {
      return fulfill(route, runs);
    }

    const runMatch = path.match(/^\/runs\/(\d+)$/);
    if (runMatch && method === "GET") {
      return fulfill(route, runs.find((run) => run.id === Number(runMatch[1])));
    }

    if (path === "/alert-rules" && method === "GET") {
      return fulfill(route, alertRules);
    }

    if (path === "/alert-rules" && method === "POST") {
      const body = await request.postDataJSON();
      const rule = {
        id: alertRules.length + 1,
        created_at: now(),
        updated_at: now(),
        ...body,
      };
      alertRules.push(rule);
      return fulfill(route, rule, 201);
    }

    if (path === "/alerts" && method === "GET") {
      return fulfill(route, alerts);
    }

    const alertMatch = path.match(/^\/alerts\/(\d+)$/);
    if (alertMatch && method === "GET") {
      return fulfill(route, alerts.find((alert) => alert.id === Number(alertMatch[1])));
    }

    const acknowledgeMatch = path.match(/^\/alerts\/(\d+)\/acknowledge$/);
    if (acknowledgeMatch && method === "PATCH") {
      const alert = alerts.find((item) => item.id === Number(acknowledgeMatch[1]));
      if (alert) {
        alert.status = "acknowledged";
        alert.acknowledged_at = now();
        alert.acknowledged_by = Number(demoUserId);
      }
      return fulfill(route, alert);
    }

    const resolveMatch = path.match(/^\/alerts\/(\d+)\/resolve$/);
    if (resolveMatch && method === "PATCH") {
      const alert = alerts.find((item) => item.id === Number(resolveMatch[1]));
      if (alert) {
        alert.status = "resolved";
        alert.resolved_at = now();
        alert.resolved_by = Number(demoUserId);
      }
      return fulfill(route, alert);
    }

    return fulfill(route, { detail: `Unhandled e2e request: ${method} ${path}` }, 404);
  });
}

function fulfill(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function userFixture(id: number, role: "admin" | "operator" | "viewer") {
  return {
    id,
    email: `${role}@example.local`,
    display_name: `Demo ${titleCase(role)}`,
    role,
    external_subject: `demo:${role}`,
    created_at: now(),
  };
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function now() {
  return "2026-01-01T00:00:00Z";
}

interface DatasetPayload {
  id: number;
  name: string;
  description: string | null;
  owner: string | null;
  source_type: string;
  schema_version: string | null;
  created_at: string;
  updated_at: string;
}

interface PipelinePayload {
  id: number;
  dataset_id: number;
  name: string;
  description: string | null;
  schedule: string | null;
  active: boolean;
  engine: string;
  processing_mode: string;
  load_type: string;
  target_layer: string;
  created_at: string;
  updated_at: string;
}

interface AlertRulePayload {
  id: number;
  pipeline_id: number;
  name: string;
  condition_type: string;
  threshold_seconds: number | null;
  threshold_records: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface RunPayload {
  id: number;
  pipeline_id: number;
  pipeline_version_id: number | null;
  trigger_type: string;
  status: string;
  started_at: string | null;
  finished_at: string | null;
  runtime_seconds: number | null;
  records_processed: number | null;
  error_message: string | null;
  created_by: number | null;
  created_at: string;
}

interface AlertPayload {
  id: number;
  rule_id: number;
  run_id: number | null;
  pipeline_id: number | null;
  message: string;
  severity: string;
  status: string;
  created_at: string;
  acknowledged_at: string | null;
  resolved_at: string | null;
  acknowledged_by: number | null;
  resolved_by: number | null;
}
