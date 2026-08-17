import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { Icons } from "@/components/icons";
import { RecordPaymentButton } from "./RecordPaymentButton";
import { GenerateRentButton } from "./GenerateRentButton";

type Row = {
  id: string;
  status: string;
  dueDate: Date;
  category: string;
  where: string;
  contact: string;
  amount: number;
  invoiceId?: string; // present when it's a payable invoice
};

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
  const incomes = await db.income.findMany({
    where: { landlordId: user.id },
    include: { property: true },
    orderBy: { dueDate: "desc" },
  });

  const rows: Row[] = [
    ...invoices.map((i) => ({
      id: "inv-" + i.id,
      status: i.status,
      dueDate: i.dueDate,
      category: i.type,
      where: i.lease.unit.label,
      contact: i.lease.tenant.name,
      amount: i.amount,
      invoiceId: i.id,
    })),
    ...incomes.map((i) => ({
      id: "inc-" + i.id,
      status: i.status,
      dueDate: i.dueDate,
      category: i.subcategory ?? i.category,
      where: i.property?.name ?? "General",
      contact: i.payer ?? "—",
      amount: i.amount,
    })),
  ].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const collectedPayments = (
    await db.payment.findMany({ where: { paidAt: { gte: monthStart }, invoice: { lease: { unit: { property: { landlordId: user.id } } } } } })
  ).reduce((s, p) => s + p.amount, 0);
  const collectedIncome = incomes.filter((i) => i.status === "PAID" && new Date(i.createdAt) >= monthStart).reduce((s, i) => s + i.amount, 0);
  const collected = collectedPayments + collectedIncome;

  const paidTotal = rows.filter((r) => r.status === "PAID").reduce((s, r) => s + r.amount, 0);
  const outstanding = rows.filter((r) => r.status === "DUE" || r.status === "PARTIAL").reduce((s, r) => s + r.amount, 0);
  const overdue = rows.filter((r) => r.status === "OVERDUE").reduce((s, r) => s + r.amount, 0);

  const filtered = rows.filter((r) => {
    if (tab === "all") return true;
    if (tab === "open") return r.status === "DUE" || r.status === "PARTIAL";
    if (tab === "overdue") return r.status === "OVERDUE";
    if (tab === "paid") return r.status === "PAID";
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
      <PageHeader
        title="Revenues"
        subtitle="Money in — rent invoices and recorded income."
        action={
          <div className="flex gap-2">
            <GenerateRentButton />
            <Link href="/revenues/new" className="btn-primary">{Icons.plus({ className: "h-4 w-4" })}Record income</Link>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Collected this month" value={formatCurrency(collected)} accent="green" />
        <StatCard label="Paid (all time)" value={formatCurrency(paidTotal)} accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} accent={outstanding ? "amber" : "brand"} />
        <StatCard label="Overdue" value={formatCurrency(overdue)} accent={overdue ? "red" : "brand"} />
      </div>

      <Tabs tabs={tabs} active={tab} />

      {filtered.length === 0 ? (
        <EmptyState title="No income here" hint="Rent invoices and anything you record show up here." />
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
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3"><Badge status={r.status} /></td>
                  <td className="px-5 py-3 text-gray-600">{formatDate(r.dueDate)}</td>
                  <td className="px-5 py-3 text-gray-500">{r.category}</td>
                  <td className="px-5 py-3 text-gray-600">{r.where}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{r.contact}</td>
                  <td className="px-5 py-3 text-right font-semibold text-green-700">+{formatCurrency(r.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    {r.invoiceId && r.status !== "PAID" && r.status !== "VOID" && <RecordPaymentButton invoiceId={r.invoiceId} />}
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
