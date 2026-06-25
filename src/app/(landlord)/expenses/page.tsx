import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { AddExpenseButton } from "./AddExpenseButton";

export default async function ExpensesPage() {
  const user = await requireRole("LANDLORD");

  const expenses = await db.expense.findMany({
    where: { OR: [{ property: { landlordId: user.id } }, { propertyId: null }] },
    include: { property: true },
    orderBy: { date: "desc" },
  });
  const properties = await db.property.findMany({ where: { landlordId: user.id }, select: { id: true, name: true } });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonth = expenses.filter((e) => new Date(e.date) >= monthStart).reduce((s, e) => s + e.amount, 0);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const open = expenses.filter((e) => e.status !== "PAID").reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <PageHeader title="Expenses" subtitle="Money out — track property costs." action={<AddExpenseButton properties={properties} />} />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="This month" value={formatCurrency(thisMonth)} accent="red" />
        <StatCard label="Total recorded" value={formatCurrency(total)} />
        <StatCard label="Unpaid" value={formatCurrency(open)} accent={open ? "amber" : "brand"} />
      </div>

      {expenses.length === 0 ? (
        <EmptyState title="No expenses yet" hint="Record your first expense to start tracking costs." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Vendor</th>
                <th className="px-5 py-3 font-medium">Property</th>
                <th className="px-5 py-3 font-medium">Memo</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-gray-600">{formatDate(e.date)}</td>
                  <td className="px-5 py-3"><span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">{e.category}</span></td>
                  <td className="px-5 py-3 text-gray-700">{e.vendor ?? "—"}</td>
                  <td className="px-5 py-3 text-gray-500">{e.property?.name ?? "Portfolio-wide"}</td>
                  <td className="px-5 py-3 text-gray-500">{e.memo ?? "—"}</td>
                  <td className="px-5 py-3"><Badge status={e.status === "PAID" ? "PAID" : "DUE"} /></td>
                  <td className="px-5 py-3 text-right font-semibold text-red-600">−{formatCurrency(e.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
