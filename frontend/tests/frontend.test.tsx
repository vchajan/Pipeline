import React from "react";
import "@testing-library/jest-dom/vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi, test } from "vitest";

import { DashboardPage } from "../src/pages/DashboardPage";
import { DatasetsPage } from "../src/pages/DatasetsPage";
import { PipelineDetailPage } from "../src/pages/PipelineDetailPage";
import { EmptyState, ErrorState } from "../src/components/StateBlock";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("frontend pages", () => {
  it("dashboard summary renders", async () => {
    mockApi({
      "/dashboard/summary": {
        datasets_count: 2,
        pipelines_count: 3,
        active_pipelines_count: 2,
        runs_count: 7,
        open_alerts_count: 1,
        runs_by_status: { success: 5, failed: 2 },
      },
      "/runs": [],
      "/alerts": [],
      "/system/status": { database: "ok", workers: [], scheduler: null },
    });

    renderWithProviders(<DashboardPage />);

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(await screen.findByText("Datasets")).toBeInTheDocument();
    expect(await screen.findByText("Pipelines")).toBeInTheDocument();
    expect(await screen.findByText("Open alerts")).toBeInTheDocument();
    expect(await screen.findByText("success")).toBeInTheDocument();
  });

  it("empty state renders", () => {
    render(<EmptyState title="Nothing here" message="Create data to continue." />);

    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Create data to continue.")).toBeInTheDocument();
  });

  it("error state renders", () => {
    render(<ErrorState title="Request failed" message="Try again later." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Request failed");
    expect(screen.getByText("Try again later.")).toBeInTheDocument();
  });

  it("viewer does not get enabled create or run actions", async () => {
    mockApi({
      "/auth/me": demoUser("viewer"),
      "/datasets": [],
      "/pipelines/1": pipelineFixture,
      "/pipelines/1/runs": [],
      "/pipelines/1/alerts": [],
    });

    renderWithProviders(<DatasetsPage />);

    expect(await screen.findByRole("button", { name: /create dataset/i })).toBeDisabled();

    renderWithProviders(
      <Routes>
        <Route path="/pipelines/:pipelineId" element={<PipelineDetailPage />} />
      </Routes>,
      "/pipelines/1",
    );

    expect(await screen.findByRole("button", { name: /run pipeline/i })).toBeDisabled();
  });

  it("operator sees an enabled Run pipeline button", async () => {
    mockApi({
      "/auth/me": demoUser("operator"),
      "/datasets": [datasetFixture],
      "/pipelines/1": pipelineFixture,
      "/pipelines/1/runs": [],
      "/pipelines/1/alerts": [],
    });

    renderWithProviders(
      <Routes>
        <Route path="/pipelines/:pipelineId" element={<PipelineDetailPage />} />
      </Routes>,
      "/pipelines/1",
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /run pipeline/i })).toBeEnabled();
    });
  });
});

function renderWithProviders(ui: ReactElement, route = "/") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
}

function mockApi(responses: Record<string, unknown>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input), "http://localhost");
      const path = url.pathname.replace(/^\/api/, "");
      if (!(path in responses)) {
        return jsonResponse({ detail: `Unhandled test request: ${path}` }, 404);
      }
      const response = responses[path];
      if (response instanceof Error) {
        throw response;
      }
      return jsonResponse(response);
    }),
  );
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function demoUser(role: "admin" | "operator" | "viewer") {
  const idByRole = { admin: 1, operator: 2, viewer: 3 };
  return {
    id: idByRole[role],
    email: `${role}@example.local`,
    display_name: `Demo ${role}`,
    role,
    external_subject: `demo:${role}`,
    created_at: "2026-01-01T00:00:00Z",
  };
}

const datasetFixture = {
  id: 1,
  name: "Orders",
  description: "Orders source",
  owner: "Data Team",
  source_type: "csv_file",
  schema_version: "v1",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

const pipelineFixture = {
  id: 1,
  dataset_id: 1,
  name: "Orders daily load",
  description: "Daily simulated pipeline",
  schedule: null,
  active: true,
  engine: "python",
  processing_mode: "batch",
  load_type: "incremental",
  target_layer: "l1_clean",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};
