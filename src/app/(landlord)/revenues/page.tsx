import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { RecordPaymentButton } from "./RecordPaymentButton";
import { GenerateRentButton } from "./GenerateRentButton";

export default async function RevenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const invoices = await db.invoice.findMany({
    where: { lease: { unit: { property: { landlordId: user.id } } } },
    include: { lease: { include: { tenant: true, unit: true } } },
    orderBy: { dueDate: "desc" },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const collected = (
    await db.payment.findMany({ where: { paidAt: { gte: monthStart }, invoice: { lease: { unit: { property: { landlordId: user.id } } } } } })
  ).reduce((s, p) => s + p.amount, 0);
  const paidTotal = invoices.filter((i) => i.status === "PAID").reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices.filter((i) => i.status === "DUE" || i.status === "PARTIAL").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "OVERDUE").reduce((s, i) => s + i.amount, 0);

  const filtered = invoices.filter((i) => {
    if (tab === "all") return true;
    if (tab === "open") return i.status === "DUE" || i.status === "PARTIAL";
    if (tab === "overdue") return i.status === "OVERDUE";
    if (tab === "paid") return i.status === "PAID";
    return true;
  });

  const tabs = [
    { key: "all", label: "All", href: "/revenues" },
    { key: "open", label: "Open", href: "/revenues?tab=open" },
    { key: "overdue", label: "Overdue", href: "/revenues?tab=overdue" },
    { key: "paid", label: "Paid", href: "/revenues?tab=paid" },
  ];

  return (
    <div>
      <PageHeader title="Revenues" subtitle="Money in — rent invoices and payments." action={<GenerateRentButton />} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Collected this month" value={formatCurrency(collected)} accent="green" />
        <StatCard label="Paid (all time)" value={formatCurrency(paidTotal)} accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} accent={outstanding ? "amber" : "brand"} />
        <StatCard label="Overdue" value={formatCurrency(overdue)} accent={overdue ? "red" : "brand"} />
      </div>

      <Tabs tabs={tabs} active={tab} />

      {filtered.length === 0 ? (
        <EmptyState title="No invoices here" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Due date</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Property / unit</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3"><Badge status={inv.status} /></td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(inv.dueDate)}</td>
                  <td className="px-5 py-3 text-gray-500">{inv.type}</td>
                  <td className="px-5 py-3 text-gray-600">{inv.lease.unit.label}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{inv.lease.tenant.name}</td>
                  <td className="px-5 py-3 text-right font-semibold text-green-700">+{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3 text-right">{inv.status !== "PAID" && inv.status !== "VOID" && <RecordPaymentButton invoiceId={inv.id} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
