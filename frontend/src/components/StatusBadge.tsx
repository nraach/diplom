type StatusBadgeProps = {
  label: string;
  value: string;
};

export function StatusBadge({ label, value }: StatusBadgeProps) {
  return <span className={`status-badge status-badge-${getTone(value)}`}>{label}</span>;
}

function getTone(value: string) {
  if (value === "repair" || value === "in_repair") {
    return "repair";
  }

  if (value === "calibration" || value === "in_calibration") {
    return "calibration";
  }

  if (value === "ready_for_handover") {
    return "ready";
  }

  if (value === "handed_over" || value === "cancelled" || value === "written_off") {
    return "done";
  }

  if (value === "active") {
    return "ready";
  }

  if (value === "pending") {
    return "warning";
  }

  if (value === "blocked") {
    return "done";
  }

  if (value === "needs_calibration") {
    return "warning";
  }

  return "default";
}
