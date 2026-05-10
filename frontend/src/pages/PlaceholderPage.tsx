import type { ReactNode } from "react";

import { useCurrentUser } from "../api/queries";
import { canManageDefinitions, canOperateRuns } from "../auth/permissions";
import { EmptyState } from "../components/StateBlock";
import { PageHeader } from "../components/PageHeader";

interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
  expectedAction?: "manage" | "operate";
  children?: ReactNode;
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  expectedAction,
  children,
}: PlaceholderPageProps) {
  const { data: user } = useCurrentUser();
  const canShowAction =
    expectedAction === "manage"
      ? canManageDefinitions(user?.role)
      : expectedAction === "operate"
        ? canOperateRuns(user?.role)
        : false;

  return (
    <section className="page">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          expectedAction ? (
            <button className="primary-button" type="button" disabled={!canShowAction}>
              {expectedAction === "manage" ? "Create" : "Run"}
            </button>
          ) : undefined
        }
      />
      {children ?? (
        <EmptyState
          title={`${title} foundation ready`}
          message="Detailed tables, forms and workflows are implemented in the next frontend phase."
        />
      )}
    </section>
  );
}
