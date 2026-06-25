import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, daysUntil } from "@/lib/utils";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";

export default async function PortalHome() {
  const user = await requireRole("TENANT");

  const lease = await db.lease.findFirst({
    where: { tenantId: user.id, status: "ACTIVE" },
    include: {
      unit: { include: { property: true } },
      invoices: { orderBy: { dueDate: "desc" } },
    },
  });

  if (!lease) {
    return (
      <div>
        <PageHeader title={`Hi, ${user.name.split(" ")[0]}`} />
        <EmptyState title="No active lease" hint="Your landlord hasn't assigned you a unit yet." />
      </div>
    );
  }

  const nextDue = lease.invoices.find((i) => i.status !== "PAID");
  const balance = lease.invoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <PageHeader
        title={`Hi, ${user.name.split(" ")[0]}`}
        subtitle={`${lease.unit.property.name} · ${lease.unit.label}`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Monthly rent" value={formatCurrency(lease.rentAmount)} />
        <StatCard
          label="Current balance"
          value={formatCurrency(balance)}
          accent={balance > 0 ? "red" : "green"}
          sub={balance > 0 ? "Payment due" : "All paid up"}
        />
        <StatCard
          label="Next due date"
          value={nextDue ? formatDate(nextDue.dueDate) : "—"}
          sub={nextDue ? `in ${daysUntil(nextDue.dueDate)} days` : undefined}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-gray-900">Your lease</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">Property</dt><dd className="font-medium text-gray-900">{lease.unit.property.name}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Unit</dt><dd className="font-medium text-gray-900">{lease.unit.label}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Address</dt><dd className="text-gray-900">{lease.unit.property.address}, {lease.unit.property.city}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Term</dt><dd className="text-gray-900">{formatDate(lease.startDate)} – {formatDate(lease.endDate)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">Deposit</dt><dd className="text-gray-900">{formatCurrency(lease.depositAmount)}</dd></div>
          </dl>
          {balance > 0 && (
            <Link href="/portal/payments" className="btn-primary mt-4 w-full">Pay rent</Link>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-gray-900">Recent invoices</h2>
          <ul className="divide-y divide-gray-100">
            {lease.invoices.slice(0, 5).map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{inv.memo ?? inv.type}</p>
                  <p className="text-xs text-gray-400">Due {formatDate(inv.dueDate)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(inv.amount)}</span>
                  <Badge status={inv.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
