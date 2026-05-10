import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys, useAlerts, useDashboardSummary, useRuns, useSystemStatus } from "../api/queries";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { AlertEvent, JobRun } from "../types/domain";
import { formatDate, formatNumber, label } from "./pageUtils";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const summaryQuery = useDashboardSummary();
  const runsQuery = useRuns();
  const alertsQuery = useAlerts();
  const systemQuery = useSystemStatus();

  const recentRuns = [...(runsQuery.data ?? [])]
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
    .slice(0, 5);
  const openAlerts = (alertsQuery.data ?? []).filter((alert) => alert.status !== "resolved").slice(0, 5);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Monitoring"
        title="Dashboard"
        description="Operational overview for datasets, pipelines, runs and alerts."
        actions={
          <button
            className="icon-button"
            type="button"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
              void queryClient.invalidateQueries({ queryKey: queryKeys.runs });
              void queryClient.invalidateQueries({ queryKey: queryKeys.alerts });
              void queryClient.invalidateQueries({ queryKey: queryKeys.system });
            }}
            aria-label="Refresh dashboard"
          >
            <RefreshCw aria-hidden="true" />
          </button>
        }
      />

      {summaryQuery.isLoading ? <LoadingState title="Loading dashboard" /> : null}
      {summaryQuery.isError ? (
        <ErrorState
          title="Dashboard unavailable"
          message={
            summaryQuery.error instanceof Error ? summaryQuery.error.message : "The summary request failed."
          }
        />
      ) : null}

      {summaryQuery.data ? (
        <>
          <div className="metric-grid" aria-label="Dashboard summary">
            <Metric label="Datasets" value={summaryQuery.data.datasets_count} />
            <Metric label="Pipelines" value={summaryQuery.data.pipelines_count} />
            <Metric label="Active pipelines" value={summaryQuery.data.active_pipelines_count} />
            <Metric label="Runs" value={summaryQuery.data.runs_count} />
            <Metric label="Open alerts" value={summaryQuery.data.open_alerts_count} tone="attention" />
          </div>

          <div className="panel-grid panel-grid--two">
            <SectionCard title="Run Status" description="Current distribution of run outcomes.">
              <div className="status-list">
                {Object.entries(summaryQuery.data.runs_by_status).length === 0 ? (
                  <p className="muted">No runs have been recorded yet.</p>
                ) : (
                  Object.entries(summaryQuery.data.runs_by_status).map(([status, count]) => (
                    <div className="status-list__row" key={status}>
                      <StatusBadge value={status} />
                      <strong>{formatNumber(count)}</strong>
                    </div>
                  ))
                )}
              </div>
            </SectionCard>

            <SectionCard title="System Status" description="Live heartbeat snapshot from the API.">
              {systemQuery.isLoading ? <LoadingState title="Loading system status" /> : null}
              {systemQuery.isError ? (
                <ErrorState title="System status unavailable" message="The status request failed." />
              ) : null}
              {systemQuery.data ? (
                <div className="detail-grid">
                  <Detail label="Database" value={<StatusBadge value={systemQuery.data.database} />} />
                  <Detail label="Workers" value={formatNumber(systemQuery.data.workers.length)} />
                  <Detail
                    label="Scheduler"
                    value={
                      systemQuery.data.scheduler ? (
                        <StatusBadge value={systemQuery.data.scheduler.status} />
                      ) : (
                        "Not seen"
                      )
                    }
                  />
                </div>
              ) : null}
            </SectionCard>
          </div>

          <div className="panel-grid panel-grid--two">
            <SectionCard title="Recent Runs" description="Latest simulated pipeline executions.">
              {runsQuery.isLoading ? <LoadingState title="Loading runs" /> : null}
              {runsQuery.isError ? <ErrorState title="Runs unavailable" message="The runs request failed." /> : null}
              {runsQuery.data ? (
                <DataTable<JobRun>
                  rows={recentRuns}
                  getRowKey={(run) => run.id}
                  emptyTitle="No runs yet"
                  emptyMessage="Start an active pipeline to create the first run."
                  columns={[
                    {
                      header: "Run",
                      render: (run) => <Link to={`/runs/${run.id}`}>#{run.id}</Link>,
                    },
                    { header: "Status", render: (run) => <StatusBadge value={run.status} /> },
                    { header: "Trigger", render: (run) => label(run.trigger_type) },
                    { header: "Created", render: (run) => formatDate(run.created_at) },
                  ]}
                />
              ) : null}
            </SectionCard>

            <SectionCard title="Open Alerts" description="Operational alerts needing attention.">
              {alertsQuery.isLoading ? <LoadingState title="Loading alerts" /> : null}
              {alertsQuery.isError ? (
                <ErrorState title="Alerts unavailable" message="The alerts request failed." />
              ) : null}
              {alertsQuery.data ? (
                <DataTable<AlertEvent>
                  rows={openAlerts}
                  getRowKey={(alert) => alert.id}
                  emptyTitle="No open alerts"
                  emptyMessage="Resolved systems are quiet here."
                  columns={[
                    {
                      header: "Alert",
                      render: (alert) => <Link to={`/alerts/${alert.id}`}>#{alert.id}</Link>,
                    },
                    { header: "Severity", render: (alert) => <StatusBadge value={alert.severity} /> },
                    { header: "Status", render: (alert) => <StatusBadge value={alert.status} /> },
                    { header: "Created", render: (alert) => formatDate(alert.created_at) },
                  ]}
                />
              ) : null}
            </SectionCard>
          </div>
        </>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "attention";
}) {
  return (
    <article className="metric" data-tone={tone}>
      <span>{label}</span>
      <strong>{formatNumber(value)}</strong>
    </article>
  );
}

function Detail({ label: detailLabel, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{detailLabel}</dt>
      <dd>{value}</dd>
    </div>
  );
}
