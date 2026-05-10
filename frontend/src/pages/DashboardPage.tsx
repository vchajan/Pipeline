import { RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useDashboardSummary } from "../api/queries";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { PageHeader } from "../components/PageHeader";

export function DashboardPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useDashboardSummary();

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
            onClick={() => void queryClient.invalidateQueries({ queryKey: ["dashboard"] })}
            aria-label="Refresh dashboard"
          >
            <RefreshCw aria-hidden="true" />
          </button>
        }
      />

      {isLoading ? <LoadingState title="Loading dashboard" /> : null}
      {isError ? (
        <ErrorState
          title="Dashboard unavailable"
          message={error instanceof Error ? error.message : "The summary request failed."}
        />
      ) : null}
      {data ? (
        <div className="metric-grid" aria-label="Dashboard summary">
          <Metric label="Datasets" value={data.datasets_count} />
          <Metric label="Pipelines" value={data.pipelines_count} />
          <Metric label="Active pipelines" value={data.active_pipelines_count} />
          <Metric label="Runs" value={data.runs_count} />
          <Metric label="Open alerts" value={data.open_alerts_count} tone="attention" />
        </div>
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
      <strong>{value}</strong>
    </article>
  );
}
