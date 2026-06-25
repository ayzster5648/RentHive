export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** The next calendar date on/after today that falls on `dueDay` of the month. */
export function nextDueDate(dueDay: number, from: Date = new Date()): Date {
  const day = Math.min(Math.max(dueDay, 1), 28); // clamp to a day every month has
  const candidate = new Date(from.getFullYear(), from.getMonth(), day);
  if (candidate.getTime() < new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime()) {
    return new Date(from.getFullYear(), from.getMonth() + 1, day);
  }
  return candidate;
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = d.getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Recompute an invoice status from its due date (used for display). */
export function effectiveInvoiceStatus(status: string, dueDate: Date): string {
  if (status === "PAID") return "PAID";
  return dueDate.getTime() < Date.now() ? "OVERDUE" : "DUE";
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
