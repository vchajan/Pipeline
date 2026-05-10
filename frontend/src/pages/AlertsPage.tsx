import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  useAcknowledgeAlert,
  useAlerts,
  useCurrentUser,
  usePipelines,
  useResolveAlert,
} from "../api/queries";
import { canOperateRuns } from "../auth/permissions";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { AlertEvent, AlertStatus } from "../types/domain";
import { alertStatuses, formatDate, label } from "./pageUtils";

export function AlertsPage() {
  const { data: user } = useCurrentUser();
  const alertsQuery = useAlerts();
  const pipelinesQuery = usePipelines();
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "all">("all");
  const canOperate = canOperateRuns(user?.role);

  const rows = useMemo(() => {
    const sorted = [...(alertsQuery.data ?? [])].sort(
      (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
    );
    return statusFilter === "all" ? sorted : sorted.filter((alert) => alert.status === statusFilter);
  }, [alertsQuery.data, statusFilter]);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Incidents"
        title="Alerts"
        description="Open, acknowledged and resolved operational incidents."
        actions={
          <label className="compact-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">All</option>
              {alertStatuses.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <SectionCard title="Alert Events" description="Incidents created by worker rule evaluation.">
        {alertsQuery.isLoading ? <LoadingState title="Loading alerts" /> : null}
        {alertsQuery.isError ? <ErrorState title="Alerts unavailable" message="The alerts request failed." /> : null}
        {alertsQuery.data ? (
          <DataTable<AlertEvent>
            rows={rows}
            getRowKey={(alert) => alert.id}
            emptyTitle="No alerts"
            emptyMessage="Alerts appear here when a rule condition is met."
            columns={[
              { header: "Alert", render: (alert) => <Link to={`/alerts/${alert.id}`}>#{alert.id}</Link> },
              {
                header: "Pipeline",
                render: (alert) => {
                  const pipeline = pipelinesQuery.data?.find((item) => item.id === alert.pipeline_id);
                  return pipeline ? (
                    <Link to={`/pipelines/${pipeline.id}`}>{pipeline.name}</Link>
                  ) : (
                    alert.pipeline_id ?? "Not set"
                  );
                },
              },
              { header: "Severity", render: (alert) => <StatusBadge value={alert.severity} /> },
              { header: "Status", render: (alert) => <StatusBadge value={alert.status} /> },
              { header: "Message", render: (alert) => <span className="truncate-cell">{alert.message}</span> },
              { header: "Created", render: (alert) => formatDate(alert.created_at) },
              { header: "Actions", render: (alert) => <AlertActions alert={alert} canOperate={canOperate} /> },
            ]}
          />
        ) : null}
      </SectionCard>
    </section>
  );
}

function AlertActions({ alert, canOperate }: { alert: AlertEvent; canOperate: boolean }) {
  const acknowledgeAlert = useAcknowledgeAlert(alert.id);
  const resolveAlert = useResolveAlert(alert.id);

  return (
    <div className="inline-actions">
      <button
        className="secondary-button"
        type="button"
        disabled={!canOperate || alert.status !== "open" || acknowledgeAlert.isPending}
        onClick={() => acknowledgeAlert.mutate()}
      >
        Acknowledge
      </button>
      <button
        className="primary-button"
        type="button"
        disabled={!canOperate || alert.status === "resolved" || resolveAlert.isPending}
        onClick={() => resolveAlert.mutate()}
      >
        Resolve
      </button>
    </div>
  );
}
