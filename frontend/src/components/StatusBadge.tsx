type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

const statusTone: Record<string, BadgeTone> = {
  active: "success",
  acknowledged: "warning",
  cancelled: "neutral",
  critical: "danger",
  error: "danger",
  failed: "danger",
  false: "neutral",
  high: "danger",
  idle: "neutral",
  low: "neutral",
  medium: "warning",
  open: "danger",
  queued: "info",
  resolved: "success",
  running: "info",
  starting: "warning",
  stopped: "neutral",
  success: "success",
  true: "success",
};

interface StatusBadgeProps {
  value: string | boolean | null | undefined;
  label?: string;
}

export function StatusBadge({ value, label }: StatusBadgeProps) {
  const normalized = String(value ?? "unknown").toLowerCase();
  return (
    <span className="status-badge" data-tone={statusTone[normalized] ?? "neutral"}>
      {label ?? humanize(normalized)}
    </span>
  );
}

function humanize(value: string) {
  return value.replace(/_/g, " ");
}
