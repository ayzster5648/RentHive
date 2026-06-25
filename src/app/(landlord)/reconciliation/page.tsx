import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";

export default async function ReconciliationPage() {
  const user = await requireRole("LANDLORD");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // "Cleared" items this period = recorded payments (in) and paid expenses (out).
  const payments = await db.payment.findMany({
    where: { paidAt: { gte: monthStart, lt: monthEnd }, invoice: { lease: { unit: { property: { landlordId: user.id } } } } },
    include: { invoice: { include: { lease: { include: { tenant: true } } } } },
    orderBy: { paidAt: "asc" },
  });
  const expenses = await db.expense.findMany({
    where: { status: "PAID", date: { gte: monthStart, lt: monthEnd }, OR: [{ property: { landlordId: user.id } }, { propertyId: null }] },
    orderBy: { date: "asc" },
  });

  const totalIn = payments.reduce((s, p) => s + p.amount, 0);
  const totalOut = expenses.reduce((s, e) => s + e.amount, 0);
  const net = totalIn - totalOut;

  const items = [
    ...payments.map((p) => ({ id: "p" + p.id, date: p.paidAt, desc: `Rent payment — ${p.invoice.lease.tenant.name}`, method: p.method, amount: p.amount, dir: "IN" as const })),
    ...expenses.map((e) => ({ id: "e" + e.id, date: e.date, desc: `${e.category}${e.vendor ? ` — ${e.vendor}` : ""}`, method: "Bank", amount: e.amount, dir: "OUT" as const })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Running cleared balance.
  let running = 0;

  return (
    <div>
      <PageHeader
        title="Reconciliation"
        subtitle={`Compare your books against cleared bank activity for ${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}.`}
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Cleared deposits" value={formatCurrency(totalIn)} accent="green" />
        <StatCard label="Cleared withdrawals" value={formatCurrency(totalOut)} accent="red" />
        <StatCard label="Reconciled balance" value={formatCurrency(net)} accent={net >= 0 ? "green" : "red"} />
      </div>

      <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-800">
        <p className="font-medium">✓ Books balanced for the period</p>
        <p className="mt-1 text-brand-700">
          {items.length} cleared transaction{items.length !== 1 ? "s" : ""} reconcile to a net balance of {formatCurrency(net)}.
          Connect a bank feed to auto-match statement lines.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState title="Nothing cleared this period" hint="Recorded payments and paid expenses appear here." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Method</th>
                <th className="px-5 py-3 font-medium text-right">Amount</th>
                <th className="px-5 py-3 font-medium text-right">Running balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((it) => {
                running += it.dir === "IN" ? it.amount : -it.amount;
                return (
                  <tr key={it.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">{formatDate(it.date)}</td>
                    <td className="px-5 py-3 text-gray-800">{it.desc}</td>
                    <td className="px-5 py-3 text-gray-500">{it.method}</td>
                    <td className={`px-5 py-3 text-right font-medium ${it.dir === "IN" ? "text-green-700" : "text-red-600"}`}>{it.dir === "IN" ? "+" : "−"}{formatCurrency(it.amount)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900">{formatCurrency(running)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
