import { RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { queryKeys, useSystemStatus } from "../api/queries";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { WorkerHeartbeat } from "../types/domain";
import { formatDate, formatNumber } from "./pageUtils";

export function SystemStatusPage() {
  const queryClient = useQueryClient();
  const systemQuery = useSystemStatus();

  return (
    <section className="page">
      <PageHeader
        eyebrow="Platform"
        title="System status"
        description="Backend readiness, worker heartbeat and scheduler heartbeat."
        actions={
          <button
            className="icon-button"
            type="button"
            aria-label="Refresh system status"
            onClick={() => void queryClient.invalidateQueries({ queryKey: queryKeys.system })}
          >
            <RefreshCw aria-hidden="true" />
          </button>
        }
      />

      {systemQuery.isLoading ? <LoadingState title="Loading system status" /> : null}
      {systemQuery.isError ? (
        <ErrorState title="System status unavailable" message="The status request failed." />
      ) : null}

      {systemQuery.data ? (
        <>
          <SectionCard title="Readiness" description="Core dependency state reported by the backend.">
            <dl className="detail-grid">
              <Detail label="Database" value={<StatusBadge value={systemQuery.data.database} />} />
              <Detail label="Workers seen" value={formatNumber(systemQuery.data.workers.length)} />
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
            </dl>
          </SectionCard>

          <SectionCard title="Workers" description="RQ worker heartbeat records.">
            <DataTable<WorkerHeartbeat>
              rows={systemQuery.data.workers}
              getRowKey={(worker) => worker.worker_id}
              emptyTitle="No workers seen"
              emptyMessage="Start the worker service to publish heartbeats."
              columns={[
                { header: "Worker", render: (worker) => worker.worker_id },
                { header: "Status", render: (worker) => <StatusBadge value={worker.status} /> },
                { header: "Last seen", render: (worker) => formatDate(worker.last_seen_at) },
                { header: "Processed", render: (worker) => formatNumber(worker.processed_jobs) },
                { header: "Current run", render: (worker) => worker.current_run_id ?? "None" },
              ]}
            />
          </SectionCard>

          <SectionCard title="Scheduler" description="Singleton scheduler heartbeat.">
            {systemQuery.data.scheduler ? (
              <dl className="detail-grid">
                <Detail label="Scheduler id" value={systemQuery.data.scheduler.scheduler_id} />
                <Detail label="Status" value={<StatusBadge value={systemQuery.data.scheduler.status} />} />
                <Detail label="Last tick" value={formatDate(systemQuery.data.scheduler.last_tick_at)} />
                <Detail
                  label="Created runs"
                  value={formatNumber(systemQuery.data.scheduler.created_runs_count)}
                />
              </dl>
            ) : (
              <EmptyState title="Scheduler not seen" message="Start the scheduler service to create heartbeats." />
            )}
          </SectionCard>
        </>
      ) : null}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
