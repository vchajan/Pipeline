import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { usePipelines, useRuns } from "../api/queries";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { JobRun, JobRunStatus } from "../types/domain";
import { formatDate, formatNumber, label, runStatuses } from "./pageUtils";

export function RunsPage() {
  const runsQuery = useRuns();
  const pipelinesQuery = usePipelines();
  const [statusFilter, setStatusFilter] = useState<JobRunStatus | "all">("all");

  const rows = useMemo(() => {
    const sorted = [...(runsQuery.data ?? [])].sort(
      (left, right) => Date.parse(right.created_at) - Date.parse(left.created_at),
    );
    return statusFilter === "all" ? sorted : sorted.filter((run) => run.status === statusFilter);
  }, [runsQuery.data, statusFilter]);

  return (
    <section className="page">
      <PageHeader
        eyebrow="Execution"
        title="Runs"
        description="Run states, timings, processed records and failures."
        actions={
          <label className="compact-field">
            <span>Status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
              <option value="all">All</option>
              {runStatuses.map((status) => (
                <option key={status} value={status}>
                  {label(status)}
                </option>
              ))}
            </select>
          </label>
        }
      />

      <SectionCard title="Job Runs" description="All pipeline execution instances.">
        {runsQuery.isLoading ? <LoadingState title="Loading runs" /> : null}
        {runsQuery.isError ? <ErrorState title="Runs unavailable" message="The runs request failed." /> : null}
        {runsQuery.data ? (
          <DataTable<JobRun>
            rows={rows}
            getRowKey={(run) => run.id}
            emptyTitle="No runs"
            emptyMessage="Runs appear here after an operator starts a pipeline or the scheduler creates one."
            columns={[
              { header: "Run", render: (run) => <Link to={`/runs/${run.id}`}>#{run.id}</Link> },
              {
                header: "Pipeline",
                render: (run) => {
                  const pipeline = pipelinesQuery.data?.find((item) => item.id === run.pipeline_id);
                  return pipeline ? (
                    <Link to={`/pipelines/${pipeline.id}`}>{pipeline.name}</Link>
                  ) : (
                    `Pipeline #${run.pipeline_id}`
                  );
                },
              },
              { header: "Status", render: (run) => <StatusBadge value={run.status} /> },
              { header: "Trigger", render: (run) => label(run.trigger_type) },
              { header: "Runtime", render: (run) => `${formatNumber(run.runtime_seconds)} sec` },
              { header: "Records", render: (run) => formatNumber(run.records_processed) },
              { header: "Created", render: (run) => formatDate(run.created_at) },
            ]}
          />
        ) : null}
      </SectionCard>
    </section>
  );
}
