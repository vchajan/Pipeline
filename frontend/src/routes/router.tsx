import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      {
        path: "datasets",
        element: (
          <PlaceholderPage
            eyebrow="Catalog"
            title="Datasets"
            description="Dataset metadata, source ownership and schema versions."
            expectedAction="manage"
          />
        ),
      },
      {
        path: "datasets/:datasetId",
        element: (
          <PlaceholderPage
            eyebrow="Catalog"
            title="Dataset detail"
            description="Dataset profile, linked pipelines and operational history."
            expectedAction="manage"
          />
        ),
      },
      {
        path: "pipelines",
        element: (
          <PlaceholderPage
            eyebrow="Definitions"
            title="Pipelines"
            description="Pipeline definitions, schedules, versions and run controls."
            expectedAction="manage"
          />
        ),
      },
      {
        path: "pipelines/:pipelineId",
        element: (
          <PlaceholderPage
            eyebrow="Definitions"
            title="Pipeline detail"
            description="Pipeline configuration, recent runs and alert activity."
            expectedAction="operate"
          />
        ),
      },
      {
        path: "pipelines/:pipelineId/versions",
        element: (
          <PlaceholderPage
            eyebrow="Definitions"
            title="Pipeline versions"
            description="Versioned execution settings and active-version management."
            expectedAction="manage"
          />
        ),
      },
      {
        path: "runs",
        element: (
          <PlaceholderPage
            eyebrow="Execution"
            title="Runs"
            description="Run states, timings, processed records and failures."
          />
        ),
      },
      {
        path: "runs/:runId",
        element: (
          <PlaceholderPage
            eyebrow="Execution"
            title="Run detail"
            description="ETL steps, timeline and run diagnostics."
            expectedAction="operate"
          />
        ),
      },
      {
        path: "alert-rules",
        element: (
          <PlaceholderPage
            eyebrow="Rules"
            title="Alert rules"
            description="Configured runtime, records, schedule and failure thresholds."
            expectedAction="manage"
          />
        ),
      },
      {
        path: "alerts",
        element: (
          <PlaceholderPage
            eyebrow="Incidents"
            title="Alerts"
            description="Open, acknowledged and resolved operational incidents."
            expectedAction="operate"
          />
        ),
      },
      {
        path: "alerts/:alertId",
        element: (
          <PlaceholderPage
            eyebrow="Incidents"
            title="Alert detail"
            description="Alert context, acknowledgement and resolution trail."
            expectedAction="operate"
          />
        ),
      },
      {
        path: "users",
        element: (
          <PlaceholderPage
            eyebrow="Access"
            title="Users"
            description="User records and RBAC role assignments."
            expectedAction="manage"
          />
        ),
      },
      {
        path: "audit-logs",
        element: (
          <PlaceholderPage
            eyebrow="Governance"
            title="Audit logs"
            description="Traceable user and system actions."
          />
        ),
      },
      {
        path: "system-status",
        element: (
          <PlaceholderPage
            eyebrow="Platform"
            title="System status"
            description="Backend readiness, worker heartbeat and scheduler heartbeat."
          />
        ),
      },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
