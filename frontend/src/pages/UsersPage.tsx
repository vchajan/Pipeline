import type { ReactNode } from "react";

import { useCurrentUser } from "../api/queries";
import { demoUsers } from "../auth/session";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";

export function UsersPage() {
  const currentUserQuery = useCurrentUser();

  return (
    <section className="page">
      <PageHeader
        eyebrow="Access"
        title="Users"
        description="User records and RBAC role assignments."
        actions={
          <button className="primary-button" type="button" disabled>
            Create user
          </button>
        }
      />

      <SectionCard title="Current User" description="Authenticated backend user resolved from Keycloak or demo auth.">
        {currentUserQuery.isLoading ? <LoadingState title="Loading current user" /> : null}
        {currentUserQuery.isError ? (
          <ErrorState title="User unavailable" message="The auth profile request failed." />
        ) : null}
        {currentUserQuery.data ? (
          <dl className="detail-grid">
            <Detail label="Display name" value={currentUserQuery.data.display_name} />
            <Detail label="Email" value={currentUserQuery.data.email} />
            <Detail label="Role" value={<StatusBadge value={currentUserQuery.data.role} />} />
            <Detail label="External subject" value={currentUserQuery.data.external_subject ?? "Demo user"} />
          </dl>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Demo Users"
        description="Fallback users available while frontend Keycloak login is not wired yet."
      >
        <DataTable
          rows={demoUsers}
          getRowKey={(user) => user.id}
          emptyTitle="No demo users"
          emptyMessage="Demo auth users are configured in the frontend session helper."
          columns={[
            { header: "ID", render: (user) => user.id },
            { header: "Label", render: (user) => user.label },
          ]}
        />
        <p className="muted">Full user management requires backend user endpoints in a later phase.</p>
      </SectionCard>
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
