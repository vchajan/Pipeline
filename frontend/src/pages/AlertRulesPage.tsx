import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  useAlertRules,
  useCreateAlertRule,
  useCurrentUser,
  useDeleteAlertRule,
  usePipelines,
  useUpdateAlertRule,
} from "../api/queries";
import { canManageDefinitions } from "../auth/permissions";
import { DataTable } from "../components/DataTable";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { ErrorState, LoadingState } from "../components/StateBlock";
import { StatusBadge } from "../components/StatusBadge";
import type { AlertRule, AlertRuleInput } from "../types/domain";
import {
  alertConditionTypes,
  formatDate,
  formatNumber,
  getMutationMessage,
  label,
  parseOptionalNumber,
} from "./pageUtils";

const initialForm: AlertRuleInput = {
  pipeline_id: 0,
  name: "",
  condition_type: "run_failed",
  threshold_seconds: null,
  threshold_records: null,
  enabled: true,
};

export function AlertRulesPage() {
  const { data: user } = useCurrentUser();
  const rulesQuery = useAlertRules();
  const pipelinesQuery = usePipelines();
  const createRule = useCreateAlertRule();
  const [form, setForm] = useState<AlertRuleInput>(initialForm);
  const [thresholdSeconds, setThresholdSeconds] = useState("");
  const [thresholdRecords, setThresholdRecords] = useState("");
  const canManage = canManageDefinitions(user?.role);

  useEffect(() => {
    if (pipelinesQuery.data?.length && form.pipeline_id === 0) {
      setForm((current) => ({ ...current, pipeline_id: pipelinesQuery.data[0].id }));
    }
  }, [pipelinesQuery.data, form.pipeline_id]);

  function updateField<Key extends keyof AlertRuleInput>(key: Key, value: AlertRuleInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createRule.mutate(
      {
        ...form,
        threshold_seconds: parseOptionalNumber(thresholdSeconds),
        threshold_records: parseOptionalNumber(thresholdRecords),
      },
      {
        onSuccess: () => {
          setForm((current) => ({ ...initialForm, pipeline_id: current.pipeline_id }));
          setThresholdSeconds("");
          setThresholdRecords("");
        },
      },
    );
  }

  return (
    <section className="page">
      <PageHeader
        eyebrow="Rules"
        title="Alert rules"
        description="Configured runtime, records, schedule and failure thresholds."
      />

      <SectionCard title="Create Alert Rule" description="Admins can configure monitoring rules.">
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Pipeline</span>
            <select
              value={form.pipeline_id}
              disabled={!canManage || createRule.isPending || !pipelinesQuery.data?.length}
              onChange={(event) => updateField("pipeline_id", Number(event.target.value))}
            >
              {(pipelinesQuery.data ?? []).map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Name</span>
            <input
              required
              value={form.name}
              disabled={!canManage || createRule.isPending}
              onChange={(event) => updateField("name", event.target.value)}
            />
          </label>
          <label className="field">
            <span>Condition</span>
            <select
              value={form.condition_type}
              disabled={!canManage || createRule.isPending}
              onChange={(event) => updateField("condition_type", event.target.value as AlertRuleInput["condition_type"])}
            >
              {alertConditionTypes.map((condition) => (
                <option key={condition} value={condition}>
                  {label(condition)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Threshold seconds</span>
            <input
              min={0}
              type="number"
              value={thresholdSeconds}
              disabled={!canManage || createRule.isPending}
              onChange={(event) => setThresholdSeconds(event.target.value)}
            />
          </label>
          <label className="field">
            <span>Threshold records</span>
            <input
              min={0}
              type="number"
              value={thresholdRecords}
              disabled={!canManage || createRule.isPending}
              onChange={(event) => setThresholdRecords(event.target.value)}
            />
          </label>
          <label className="field field--checkbox">
            <input
              type="checkbox"
              checked={form.enabled}
              disabled={!canManage || createRule.isPending}
              onChange={(event) => updateField("enabled", event.target.checked)}
            />
            <span>Enabled</span>
          </label>
          <div className="form-actions">
            <button
              className="primary-button"
              type="submit"
              disabled={!canManage || createRule.isPending || form.pipeline_id === 0}
            >
              Create rule
            </button>
            {!canManage ? <span className="muted">Admin role required.</span> : null}
            {createRule.isError ? (
              <span className="form-message form-message--error">{getMutationMessage(createRule.error)}</span>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Rules" description="Monitoring rules evaluated by the worker.">
        {rulesQuery.isLoading ? <LoadingState title="Loading alert rules" /> : null}
        {rulesQuery.isError ? (
          <ErrorState title="Alert rules unavailable" message="The alert rules request failed." />
        ) : null}
        {rulesQuery.data ? (
          <DataTable<AlertRule>
            rows={rulesQuery.data}
            getRowKey={(rule) => rule.id}
            emptyTitle="No alert rules"
            emptyMessage="Create alert rules after pipelines are available."
            columns={[
              { header: "Name", render: (rule) => rule.name },
              {
                header: "Pipeline",
                render: (rule) => {
                  const pipeline = pipelinesQuery.data?.find((item) => item.id === rule.pipeline_id);
                  return pipeline ? (
                    <Link to={`/pipelines/${pipeline.id}`}>{pipeline.name}</Link>
                  ) : (
                    `Pipeline #${rule.pipeline_id}`
                  );
                },
              },
              { header: "Condition", render: (rule) => label(rule.condition_type) },
              { header: "Seconds", render: (rule) => formatNumber(rule.threshold_seconds) },
              { header: "Records", render: (rule) => formatNumber(rule.threshold_records) },
              { header: "Enabled", render: (rule) => <StatusBadge value={rule.enabled} /> },
              { header: "Updated", render: (rule) => formatDate(rule.updated_at) },
              {
                header: "Actions",
                render: (rule) => <RuleActions rule={rule} canManage={canManage} />,
              },
            ]}
          />
        ) : null}
      </SectionCard>
    </section>
  );
}

function RuleActions({ rule, canManage }: { rule: AlertRule; canManage: boolean }) {
  const updateRule = useUpdateAlertRule(rule.id);
  const deleteRule = useDeleteAlertRule();

  return (
    <div className="inline-actions">
      <button
        className="secondary-button"
        type="button"
        disabled={!canManage || updateRule.isPending}
        onClick={() => updateRule.mutate({ enabled: !rule.enabled })}
      >
        {rule.enabled ? "Disable" : "Enable"}
      </button>
      <button
        className="danger-button"
        type="button"
        disabled={!canManage || deleteRule.isPending}
        onClick={() => deleteRule.mutate(rule.id)}
      >
        Delete
      </button>
    </div>
  );
}
