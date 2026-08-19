// Shared, server-safe status + priority pills that match the TenantCloud look.

export const STATUS_META: Record<string, { label: string; text: string; mark: string }> = {
  OPEN: { label: "New", text: "text-red-600", mark: "●" },
  IN_PROGRESS: { label: "In progress", text: "text-amber-600", mark: "●" },
  IN_REVIEW: { label: "In review", text: "text-yellow-600", mark: "◐" },
  RESOLVED: { label: "Resolved", text: "text-green-600", mark: "✓" },
  CANCELLED: { label: "Cancelled", text: "text-red-600", mark: "✕" },
};

export const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "IN_REVIEW", "RESOLVED", "CANCELLED"] as const;

export function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.OPEN;
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${m.text}`}>
      <span className="text-[10px] leading-none">{m.mark}</span>
      {m.label}
    </span>
  );
}

const PRIORITY_META: Record<string, { label: string; sq: string }> = {
  LOW: { label: "Low", sq: "bg-gray-400" },
  MEDIUM: { label: "Normal", sq: "bg-green-500" },
  HIGH: { label: "High", sq: "bg-orange-500" },
  URGENT: { label: "Urgent", sq: "bg-red-500" },
};

export function PriorityPill({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority] ?? PRIORITY_META.MEDIUM;
  return (
    <span className="inline-flex items-center gap-2 text-sm text-gray-700">
      <span className={`h-2.5 w-2.5 rounded-[3px] ${m.sq}`} />
      {m.label}
    </span>
  );
}
