import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import {
  useAcknowledgeAlert,
  useAlert,
  useAlertRule,
  useCurrentUser,
  usePipeline,
  useResolveAlert,
  useRun,
} from "../api/queries";
import { canOperateRuns } from "../auth/permissions";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { EmptyState, ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import { formatDate, getMutationMessage, label } from "./pageUtils";

export function AlertDetailPage() {
  const alertId = Number(useParams().alertId);
  const { data: user } = useCurrentUser();
  const alertQuery = useAlert(Number.isFinite(alertId) ? alertId : undefined);
  const alert = alertQuery.data;
  const pipelineQuery = usePipeline(alert?.pipeline_id ?? undefined);
  const runQuery = useRun(alert?.run_id ?? undefined);
  const ruleQuery = useAlertRule(alert?.rule_id);
  const acknowledgeAlert = useAcknowledgeAlert(alertId);
  const resolveAlert = useResolveAlert(alertId);
  const canOperate = canOperateRuns(user?.role);

  if (!Number.isFinite(alertId)) {
    return <EmptyState title="Alert not found" message="The route did not include a valid alert id." />;
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Incidents"
        title={alert ? `Alert #${alert.id}` : "Alert detail"}
        description="Alert context, acknowledgement and resolution trail."
        actions={
          <div className="inline-actions">
            <button
              className="secondary-button"
              type="button"
              disabled={!canOperate || alert?.status !== "open" || acknowledgeAlert.isPending}
              onClick={() => acknowledgeAlert.mutate()}
            >
              Acknowledge
            </button>
            <button
              className="primary-button"
              type="button"
              disabled={!canOperate || alert?.status === "resolved" || resolveAlert.isPending}
              onClick={() => resolveAlert.mutate()}
            >
              Resolve
            </button>
          </div>
        }
      />

      {alertQuery.isLoading ? <LoadingState title="Loading alert" /> : null}
      {alertQuery.isError ? <ErrorState title="Alert unavailable" message="The alert detail request failed." /> : null}

      {alert ? (
        <>
          <SectionCard title="Incident" description={alert.message}>
            <dl className="detail-grid">
              <Detail label="Severity" value={<StatusBadge value={alert.severity} />} />
              <Detail label="Status" value={<StatusBadge value={alert.status} />} />
              <Detail
                label="Pipeline"
                value={
                  pipelineQuery.data ? (
                    <Link to={`/pipelines/${pipelineQuery.data.id}`}>{pipelineQuery.data.name}</Link>
                  ) : (
                    alert.pipeline_id ?? "Not set"
                  )
                }
              />
              <Detail
                label="Run"
                value={runQuery.data ? <Link to={`/runs/${runQuery.data.id}`}>#{runQuery.data.id}</Link> : "Not set"}
              />
              <Detail label="Rule" value={ruleQuery.data?.name ?? `Rule #${alert.rule_id}`} />
              <Detail label="Created" value={formatDate(alert.created_at)} />
              <Detail label="Acknowledged" value={formatDate(alert.acknowledged_at)} />
              <Detail label="Resolved" value={formatDate(alert.resolved_at)} />
            </dl>
            {!canOperate ? <p className="muted">Operator role required to acknowledge or resolve alerts.</p> : null}
            {acknowledgeAlert.isError ? (
              <p className="form-message form-message--error">{getMutationMessage(acknowledgeAlert.error)}</p>
            ) : null}
            {resolveAlert.isError ? (
              <p className="form-message form-message--error">{getMutationMessage(resolveAlert.error)}</p>
            ) : null}
          </SectionCard>

          <SectionCard title="Rule Context" description="Condition that created this alert.">
            {ruleQuery.isLoading ? <LoadingState title="Loading alert rule" /> : null}
            {ruleQuery.isError ? (
              <ErrorState title="Rule unavailable" message="The alert rule request failed." />
            ) : null}
            {ruleQuery.data ? (
              <dl className="detail-grid">
                <Detail label="Condition" value={label(ruleQuery.data.condition_type)} />
                <Detail label="Enabled" value={<StatusBadge value={ruleQuery.data.enabled} />} />
                <Detail label="Threshold seconds" value={ruleQuery.data.threshold_seconds ?? "Not set"} />
                <Detail label="Threshold records" value={ruleQuery.data.threshold_records ?? "Not set"} />
              </dl>
            ) : null}
          </SectionCard>
        </>
      ) : null}
    </section>
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
