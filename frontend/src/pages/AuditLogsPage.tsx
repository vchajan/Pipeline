import { useAuditLogs } from "../api/queries";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ErrorState, LoadingState } from "../components/StateBlock";
import type { AuditLog } from "../types/domain";
import { formatDate } from "./pageUtils";

export function AuditLogsPage() {
  const auditLogsQuery = useAuditLogs();

  return (
    <section className="page">
      <PageHeader
        eyebrow="Governance"
        title="Audit logs"
        description="Traceable user and system actions."
      />

      <SectionCard title="Events" description="Append-only audit trail from backend services.">
        {auditLogsQuery.isLoading ? <LoadingState title="Loading audit logs" /> : null}
        {auditLogsQuery.isError ? (
          <ErrorState title="Audit logs unavailable" message="The audit log request failed." />
        ) : null}
        {auditLogsQuery.data ? (
          <DataTable<AuditLog>
            rows={auditLogsQuery.data}
            getRowKey={(log) => log.id}
            emptyTitle="No audit logs"
            emptyMessage="Actions from workers and users will appear here."
            columns={[
              { header: "Time", render: (log) => formatDate(log.created_at) },
              { header: "Actor", render: (log) => log.actor_email ?? log.actor_user_id ?? "System" },
              { header: "Action", render: (log) => log.action },
              { header: "Entity", render: (log) => `${log.entity_type} ${log.entity_id ?? ""}` },
              {
                header: "Metadata",
                render: (log) => (
                  <code className="inline-code">
                    {log.metadata_json ? JSON.stringify(log.metadata_json) : "None"}
                  </code>
                ),
              },
            ]}
          />
        ) : null}
      </SectionCard>
    </section>
  );
}
