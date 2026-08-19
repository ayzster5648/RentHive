import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { Icons } from "@/components/icons";
import { MoneyMenu } from "./MoneyMenu";

type Row = {
  id: string; href: string; date: Date; direction: "IN" | "OUT";
  category: string; recurring: boolean; property: string; contact: string;
  amount: number; balance: number; status: string;
};

const PILLS = [
  { key: "all", label: "All" }, { key: "open", label: "Open" }, { key: "partial", label: "Partial" },
  { key: "overdue", label: "Overdue" }, { key: "void", label: "Void" },
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "all" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const [invoices, expenses, incomes, recurringLeaseIds] = await Promise.all([
    db.invoice.findMany({ where: { lease: { unit: { property: { landlordId: user.id } } } }, include: { lease: { include: { tenant: true, unit: { include: { property: true } } } }, payments: true } }),
    db.expense.findMany({ where: { OR: [{ property: { landlordId: user.id } }, { propertyId: null }] }, include: { property: true } }),
    db.income.findMany({ where: { landlordId: user.id }, include: { property: true } }),
    db.recurringInvoice.findMany({ where: { status: "ACTIVE" }, select: { leaseId: true } }),
  ]);
  const recurringSet = new Set(recurringLeaseIds.map((r) => r.leaseId));

  const rows: Row[] = [
    ...invoices.map((i) => ({
      id: "inv-" + i.id, href: `/revenues/tx/inv-${i.id}`, date: i.dueDate, direction: "IN" as const,
      category: i.type === "RENT" ? "Rent" : i.type === "DEPOSIT" ? "Security Deposit" : i.type.replace(/_/g, " "),
      recurring: i.type === "RENT" && recurringSet.has(i.leaseId),
      property: `${i.lease.unit.property.name}, ${i.lease.unit.label}`, contact: i.lease.tenant.name,
      amount: i.amount, balance: i.status === "PAID" ? 0 : i.amount - i.payments.reduce((s, p) => s + p.amount, 0), status: i.status,
    })),
    ...incomes.map((i) => ({
      id: "inc-" + i.id, href: `/revenues/tx/inc-${i.id}`, date: i.dueDate, direction: "IN" as const,
      category: i.subcategory ?? i.category, recurring: false,
      property: i.property?.name ?? "—", contact: i.payer ?? "—",
      amount: i.amount, balance: i.status === "PAID" ? 0 : i.amount, status: i.status,
    })),
    ...expenses.map((e) => ({
      id: "exp-" + e.id, href: `/revenues/tx/exp-${e.id}`, date: e.date, direction: "OUT" as const,
      category: e.category, recurring: false,
      property: e.property?.name ?? "Portfolio-wide", contact: e.vendor ?? "—",
      amount: e.amount, balance: e.status === "PAID" ? 0 : e.amount, status: e.status === "PAID" ? "PAID" : "DUE",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const paid = rows.filter((r) => r.status === "PAID").reduce((s, r) => s + r.amount, 0);
  const outstanding = rows.filter((r) => r.status === "DUE" || r.status === "PARTIAL").reduce((s, r) => s + r.balance, 0);
  const overdue = rows.filter((r) => r.status === "OVERDUE").reduce((s, r) => s + r.balance, 0);

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    if (tab === "open") return r.status === "DUE";
    if (tab === "partial") return r.status === "PARTIAL";
    if (tab === "overdue") return r.status === "OVERDUE";
    if (tab === "void") return r.status === "VOID";
    return true;
  });

  // Group by month.
  const groups = new Map<string, Row[]>();
  for (const r of filtered) {
    const key = new Date(r.date).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return (
    <div>
      <PageHeader title="Transactions" action={<MoneyMenu />} />

      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {PILLS.map((p) => (
          <Link key={p.key} href={`/transactions${p.key === "all" ? "" : `?tab=${p.key}`}`}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-medium", tab === p.key ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50")}>{p.label}</Link>
        ))}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} accent={outstanding ? "amber" : "brand"} />
        <StatCard label="Paid" value={formatCurrency(paid)} accent="green" />
        <StatCard label="Overdue" value={formatCurrency(overdue)} accent={overdue ? "red" : "brand"} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No transactions here" />
      ) : (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[90px_90px_1.2fr_1.4fr_1fr_110px_90px] gap-4 border-b border-gray-100 bg-gray-50 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            <span>Status</span><span>Due date</span><span>Category</span><span>Property</span><span>Contact</span><span className="text-right">Total</span><span className="text-right">Balance</span>
          </div>
          {[...groups.entries()].map(([month, rs]) => (
            <div key={month}>
              <div className="border-b border-gray-100 bg-gray-50/60 px-5 py-1.5 text-xs font-semibold text-gray-500">{month}</div>
              {rs.map((r) => (
                <Link key={r.id} href={r.href} className="grid grid-cols-[90px_90px_1.2fr_1.4fr_1fr_110px_90px] items-center gap-4 border-b border-gray-50 px-5 py-3 text-sm hover:bg-gray-50">
                  <Badge status={r.status} />
                  <span className="text-gray-600">{formatDate(r.date)}</span>
                  <span className="flex items-center gap-1 text-gray-700">{r.category}{r.recurring && Icons.transactions({ className: "h-3.5 w-3.5 text-gray-400" })}</span>
                  <span className="truncate text-gray-500">{r.property}</span>
                  <span className="truncate font-medium text-gray-900">{r.contact}</span>
                  <span className={cn("text-right font-semibold", r.direction === "IN" ? "text-green-700" : "text-red-600")}>{r.direction === "IN" ? "+" : "−"}{formatCurrency(r.amount)}</span>
                  <span className="text-right text-gray-500">{formatCurrency(r.balance)}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
