import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { PayButton } from "./PayButton";

export default async function PortalPayments() {
  const user = await requireRole("TENANT");

  const lease = await db.lease.findFirst({
    where: { tenantId: user.id, status: "ACTIVE" },
    include: {
      invoices: { include: { payments: true }, orderBy: { dueDate: "desc" } },
    },
  });

  if (!lease) {
    return (
      <div>
        <PageHeader title="Pay Rent" />
        <EmptyState title="No active lease" />
      </div>
    );
  }

  const balance = lease.invoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <PageHeader title="Pay Rent" subtitle="View and pay your invoices." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Outstanding balance" value={formatCurrency(balance)} accent={balance > 0 ? "red" : "green"} />
        <StatCard label="Monthly rent" value={formatCurrency(lease.rentAmount)} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Invoice</th>
              <th className="px-5 py-3 font-medium">Due</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lease.invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <p className="font-medium text-gray-900">{inv.memo ?? inv.type}</p>
                  {inv.payments[0] && (
                    <p className="text-xs text-gray-400">Paid {formatDate(inv.payments[0].paidAt)} · {inv.payments[0].method}</p>
                  )}
                </td>
                <td className="px-5 py-3 text-gray-600">{formatDate(inv.dueDate)}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{formatCurrency(inv.amount)}</td>
                <td className="px-5 py-3"><Badge status={inv.status} /></td>
                <td className="px-5 py-3 text-right">
                  {inv.status !== "PAID" && <PayButton invoiceId={inv.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Demo mode — “Pay now” simulates a successful card payment. Wire up Stripe test mode to take real test payments.
      </p>
    </div>
  );
}
