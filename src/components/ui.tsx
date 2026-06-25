import { cn, initials } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  // Unit
  VACANT: "bg-amber-100 text-amber-800",
  OCCUPIED: "bg-green-100 text-green-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  // Lease
  ACTIVE: "bg-green-100 text-green-800",
  PENDING: "bg-blue-100 text-blue-800",
  ENDED: "bg-gray-100 text-gray-700",
  // Invoice
  PAID: "bg-green-100 text-green-800",
  DUE: "bg-blue-100 text-blue-800",
  OVERDUE: "bg-red-100 text-red-800",
  // Maintenance
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
  // Priority
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export function Badge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusStyles[status] ?? "bg-gray-100 text-gray-700"
      )}
    >
      {label.toLowerCase()}
    </span>
  );
}

export function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
      {initials(name)}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = "brand",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "brand" | "green" | "amber" | "red";
}) {
  const accents = {
    brand: "text-brand-600",
    green: "text-green-600",
    amber: "text-amber-600",
    red: "text-red-600",
  };
  return (
    <div className="card p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={cn("mt-2 text-3xl font-bold", accents[accent])}>{value}</p>
      {sub && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card flex flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-lg font-medium text-gray-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-gray-400">{hint}</p>}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
