import { createBrowserRouter, Navigate } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { AlertDetailPage } from "../pages/AlertDetailPage";
import { AlertRulesPage } from "../pages/AlertRulesPage";
import { AlertsPage } from "../pages/AlertsPage";
import { AuditLogsPage } from "../pages/AuditLogsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { DatasetDetailPage } from "../pages/DatasetDetailPage";
import { DatasetsPage } from "../pages/DatasetsPage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { PipelineDetailPage } from "../pages/PipelineDetailPage";
import { PipelineVersionsPage } from "../pages/PipelineVersionsPage";
import { PipelinesPage } from "../pages/PipelinesPage";
import { RunDetailPage } from "../pages/RunDetailPage";
import { RunsPage } from "../pages/RunsPage";
import { SystemStatusPage } from "../pages/SystemStatusPage";
import { UsersPage } from "../pages/UsersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "datasets", element: <DatasetsPage /> },
      { path: "datasets/:datasetId", element: <DatasetDetailPage /> },
      { path: "pipelines", element: <PipelinesPage /> },
      { path: "pipelines/:pipelineId", element: <PipelineDetailPage /> },
      { path: "pipelines/:pipelineId/versions", element: <PipelineVersionsPage /> },
      { path: "runs", element: <RunsPage /> },
      { path: "runs/:runId", element: <RunDetailPage /> },
      { path: "alert-rules", element: <AlertRulesPage /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "alerts/:alertId", element: <AlertDetailPage /> },
      { path: "users", element: <UsersPage /> },
      { path: "audit-logs", element: <AuditLogsPage /> },
      { path: "system-status", element: <SystemStatusPage /> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "*", element: <NotFoundPage /> },
]);
