import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";

type Row = {
  id: string;
  date: Date;
  direction: "IN" | "OUT";
  category: string;
  property: string;
  contact: string;
  amount: number;
  status: string;
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const invoices = await db.invoice.findMany({
    where: { lease: { unit: { property: { landlordId: user.id } } } },
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
  });
  const expenses = await db.expense.findMany({
    where: { OR: [{ property: { landlordId: user.id } }, { propertyId: null }] },
    include: { property: true },
  });

  const rows: Row[] = [
    ...invoices.map((i) => ({
      id: "inv-" + i.id,
      date: i.dueDate,
      direction: "IN" as const,
      category: i.type,
      property: `${i.lease.unit.property.name} · ${i.lease.unit.label}`,
      contact: i.lease.tenant.name,
      amount: i.amount,
      status: i.status,
    })),
    ...expenses.map((e) => ({
      id: "exp-" + e.id,
      date: e.date,
      direction: "OUT" as const,
      category: e.category,
      property: e.property?.name ?? "Portfolio-wide",
      contact: e.vendor ?? "—",
      amount: e.amount,
      status: e.status === "PAID" ? "PAID" : "DUE",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalIn = rows.filter((r) => r.direction === "IN" && r.status === "PAID").reduce((s, r) => s + r.amount, 0);
  const totalOut = rows.filter((r) => r.direction === "OUT" && r.status === "PAID").reduce((s, r) => s + r.amount, 0);
  const outstanding = rows.filter((r) => r.status !== "PAID" && r.status !== "VOID").reduce((s, r) => s + r.amount, 0);

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    if (tab === "in") return r.direction === "IN";
    if (tab === "out") return r.direction === "OUT";
    if (tab === "open") return r.status === "DUE" || r.status === "PARTIAL";
    if (tab === "overdue") return r.status === "OVERDUE";
    return true;
  });

  const tabs = [
    { key: "all", label: "All", href: "/transactions" },
    { key: "in", label: "Money in", href: "/transactions?tab=in" },
    { key: "out", label: "Money out", href: "/transactions?tab=out" },
    { key: "open", label: "Open", href: "/transactions?tab=open" },
    { key: "overdue", label: "Overdue", href: "/transactions?tab=overdue" },
  ];

  return (
    <div>
      <PageHeader title="Transactions" subtitle="Every dollar in and out across your portfolio." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Income (paid)" value={formatCurrency(totalIn)} accent="green" />
        <StatCard label="Expenses (paid)" value={formatCurrency(totalOut)} accent="red" />
        <StatCard label="Net / Outstanding" value={formatCurrency(totalIn - totalOut)} sub={`${formatCurrency(outstanding)} outstanding`} accent={totalIn - totalOut >= 0 ? "green" : "red"} />
      </div>

      <Tabs tabs={tabs} active={tab} />

      {filtered.length === 0 ? (
        <EmptyState title="No transactions here" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Property</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3"><Badge status={r.status} /></td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(r.date)}</td>
                  <td className="px-5 py-3 text-gray-500">{r.category}</td>
                  <td className="px-5 py-3 text-gray-600">{r.property}</td>
                  <td className="px-5 py-3 text-gray-700">{r.contact}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${r.direction === "IN" ? "text-green-700" : "text-red-600"}`}>
                    {r.direction === "IN" ? "+" : "−"}{formatCurrency(r.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
