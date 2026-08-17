import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PageHeader, StatCard, Badge } from "@/components/ui";
import { Icons } from "@/components/icons";
import { GenerateRentButton } from "./GenerateRentButton";

const TABS = [
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
  { key: "recurring", label: "Recurring" },
  { key: "refunds", label: "Refunds" },
];

function subLink(tab: string, sub: string, property?: string) {
  const p = new URLSearchParams();
  if (tab !== "invoices") p.set("tab", tab);
  if (sub && sub !== "all") p.set("sub", sub);
  if (property) p.set("property", property);
  const qs = p.toString();
  return `/revenues${qs ? `?${qs}` : ""}`;
}

function FilterPills({ tab, sub, property, options }: { tab: string; sub: string; property?: string; options: { key: string; label: string }[] }) {
  return (
    <div className="mb-5 flex flex-wrap gap-2">
      {options.map((o) => (
        <Link key={o.key} href={subLink(tab, o.key, property)}
          className={cn("rounded-lg px-4 py-1.5 text-sm font-medium", (sub || "all") === o.key ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50")}>
          {o.label}
        </Link>
      ))}
    </div>
  );
}

const HEAD = "grid items-center gap-4 border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400";
const ROW = "grid items-center gap-4 px-5 py-3 text-sm hover:bg-gray-50";

export default async function RevenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sub?: string; property?: string }>;
}) {
  const { tab = "invoices", sub = "all", property } = await searchParams;
  const user = await requireRole("LANDLORD");

  const propScope = property ? { id: property, landlordId: user.id } : { landlordId: user.id };
  const propertyName = property ? (await db.property.findUnique({ where: { id: property } }))?.name : undefined;

  const tabs = TABS.map((t) => ({ key: t.key, label: t.label, href: subLink(t.key, "all", property) }));

  return (
    <div>
      <PageHeader
        title={propertyName ? `Revenues · ${propertyName}` : "Revenues"}
        subtitle="Money in — invoices, payments, recurring, and refunds."
        action={<div className="flex gap-2"><GenerateRentButton /><Link href="/revenues/new" className="btn-primary">{Icons.plus({ className: "h-4 w-4" })}Record income</Link></div>}
      />

      {/* Sub-tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <Link key={t.key} href={t.href} className={cn("-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium", t.key === tab ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800")}>{t.label}</Link>
        ))}
      </div>

      {tab === "invoices" && <InvoicesTab landlordId={user.id} propId={property} sub={sub} />}
      {tab === "payments" && <PaymentsTab landlordId={user.id} propId={property} sub={sub} />}
      {tab === "recurring" && <RecurringTab landlordId={user.id} propId={property} />}
      {tab === "refunds" && <RefundsTab />}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function InvoicesTab({ landlordId, propId, sub }: { landlordId: string; propId?: string; sub: string }) {
  const where: any = { lease: { unit: { property: { landlordId, ...(propId ? { id: propId } : {}) } } } };
  const invoices = await db.invoice.findMany({ where, include: { lease: { include: { tenant: true, unit: { include: { property: true } } } }, payments: true }, orderBy: { dueDate: "desc" } });
  const incomes = propId
    ? await db.income.findMany({ where: { landlordId, propertyId: propId }, include: { property: true }, orderBy: { dueDate: "desc" } })
    : await db.income.findMany({ where: { landlordId }, include: { property: true }, orderBy: { dueDate: "desc" } });

  type R = { href: string; status: string; due: Date; category: string; property: string; contact: string; total: number; balance: number };
  const rows: R[] = [
    ...invoices.map((i) => ({
      href: `/revenues/tx/inv-${i.id}`, status: i.status, due: i.dueDate, category: i.memo ?? i.type,
      property: `${i.lease.unit.property.name}, ${i.lease.unit.label}`, contact: i.lease.tenant.name,
      total: i.amount, balance: i.status === "PAID" ? 0 : i.amount - i.payments.reduce((s, p) => s + p.amount, 0),
    })),
    ...incomes.map((i) => ({
      href: `/revenues/tx/inc-${i.id}`, status: i.status, due: i.dueDate, category: i.subcategory ?? i.category,
      property: i.property?.name ?? "General", contact: i.payer ?? "—", total: i.amount, balance: i.status === "PAID" ? 0 : i.amount,
    })),
  ].sort((a, b) => new Date(b.due).getTime() - new Date(a.due).getTime());

  const outstanding = rows.filter((r) => r.status === "DUE" || r.status === "PARTIAL").reduce((s, r) => s + r.total, 0);
  const paid = rows.filter((r) => r.status === "PAID").reduce((s, r) => s + r.total, 0);
  const overdue = rows.filter((r) => r.status === "OVERDUE").reduce((s, r) => s + r.total, 0);

  const options = [
    { key: "all", label: "All" }, { key: "open", label: "Open" }, { key: "partial", label: "Partial" },
    { key: "overdue", label: "Overdue" }, { key: "void", label: "Void" },
  ];
  const filtered = rows.filter((r) => {
    if (sub === "all") return true;
    if (sub === "open") return r.status === "DUE";
    if (sub === "partial") return r.status === "PARTIAL";
    if (sub === "overdue") return r.status === "OVERDUE";
    if (sub === "void") return r.status === "VOID";
    return true;
  });

  return (
    <>
      <FilterPills tab="invoices" sub={sub} property={propId} options={options} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} accent={outstanding ? "amber" : "brand"} />
        <StatCard label="Paid" value={formatCurrency(paid)} accent="green" />
        <StatCard label="Overdue" value={formatCurrency(overdue)} accent={overdue ? "red" : "brand"} />
      </div>
      <div className="card overflow-hidden">
        <div className={cn(HEAD, "grid-cols-[90px_90px_1fr_1.4fr_1fr_100px_90px]")}>
          <span>Status</span><span>Due date</span><span>Category</span><span>Property</span><span>Contact</span><span className="text-right">Total</span><span className="text-right">Balance</span>
        </div>
        {filtered.length === 0 ? <p className="px-5 py-10 text-center text-sm text-gray-400">No invoices here.</p> :
          filtered.map((r, i) => (
            <Link key={i} href={r.href} className={cn(ROW, "grid-cols-[90px_90px_1fr_1.4fr_1fr_100px_90px]")}>
              <Badge status={r.status} />
              <span className="text-gray-600">{formatDate(r.due)}</span>
              <span className="text-gray-700">{r.category}</span>
              <span className="text-gray-500">{r.property}</span>
              <span className="font-medium text-gray-900">{r.contact}</span>
              <span className="text-right font-semibold text-green-700">+{formatCurrency(r.total)}</span>
              <span className="text-right text-gray-600">{formatCurrency(r.balance)}</span>
            </Link>
          ))}
      </div>
    </>
  );
}

async function PaymentsTab({ landlordId, propId, sub }: { landlordId: string; propId?: string; sub: string }) {
  const payments = await db.payment.findMany({
    where: { invoice: { lease: { unit: { property: { landlordId, ...(propId ? { id: propId } : {}) } } } } },
    include: { invoice: { include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } } } },
    orderBy: { paidAt: "desc" },
  });
  const paidTotal = payments.reduce((s, p) => s + p.amount, 0);
  const options = [
    { key: "all", label: "All" }, { key: "success", label: "Success" }, { key: "pending", label: "Pending" },
    { key: "failed", label: "Failed" }, { key: "manual", label: "Marked as Paid" },
  ];
  // Every recorded payment is a successful one in this model.
  const filtered = payments.filter((p) => {
    if (sub === "all" || sub === "success") return true;
    if (sub === "manual") return p.method === "Manual";
    return false; // pending / failed
  });

  return (
    <>
      <FilterPills tab="payments" sub={sub} property={propId} options={options} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Paid" value={formatCurrency(paidTotal)} accent="green" />
        <StatCard label="Pending" value={formatCurrency(0)} />
      </div>
      <div className="card overflow-hidden">
        <div className={cn(HEAD, "grid-cols-[90px_100px_1fr_1.4fr_1fr_110px]")}>
          <span>Status</span><span>Date paid</span><span>Category</span><span>Property</span><span>Contact</span><span className="text-right">Amount</span>
        </div>
        {filtered.length === 0 ? <p className="px-5 py-10 text-center text-sm text-gray-400">No payments here.</p> :
          filtered.map((p) => (
            <Link key={p.id} href={`/revenues/payment/${p.id}`} className={cn(ROW, "grid-cols-[90px_100px_1fr_1.4fr_1fr_110px]")}>
              <span className="inline-flex items-center gap-1 text-green-700">{Icons.check({ className: "h-4 w-4" })}Success</span>
              <span className="text-gray-600">{formatDate(p.paidAt)}</span>
              <span className="text-gray-700">{p.invoice.memo ?? p.invoice.type}</span>
              <span className="text-gray-500">{p.invoice.lease.unit.property.name}, {p.invoice.lease.unit.label}</span>
              <span className="font-medium text-gray-900">{p.invoice.lease.tenant.name}</span>
              <span className="text-right font-semibold text-gray-900">{formatCurrency(p.amount)}</span>
            </Link>
          ))}
      </div>
    </>
  );
}

async function RecurringTab({ landlordId, propId }: { landlordId: string; propId?: string }) {
  const recs = await db.recurringInvoice.findMany({
    where: { lease: { unit: { property: { landlordId, ...(propId ? { id: propId } : {}) } } } },
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <>
      <div className="card overflow-hidden">
        <div className={cn(HEAD, "grid-cols-[90px_100px_140px_1.6fr_1fr_110px]")}>
          <span>Status</span><span>Next date</span><span>Type</span><span>Category &amp; property</span><span>Contact</span><span className="text-right">Amount</span>
        </div>
        {recs.length === 0 ? <p className="px-5 py-10 text-center text-sm text-gray-400">No recurring invoices.</p> :
          recs.map((r) => (
            <Link key={r.id} href={`/revenues/recurring/${r.id}`} className={cn(ROW, "grid-cols-[90px_100px_140px_1.6fr_1fr_110px]")}>
              <span><Badge status={r.status === "ACTIVE" ? "ACTIVE" : "ENDED"} /></span>
              <span className="text-gray-600">{r.status === "ACTIVE" ? formatDate(r.nextDate) : "—"}</span>
              <span className="text-gray-500">Income / Monthly</span>
              <span className="text-gray-700">{r.category} · <span className="text-gray-400">{r.lease.unit.property.name}, {r.lease.unit.label}</span></span>
              <span className="font-medium text-gray-900">{r.lease.tenant.name}</span>
              <span className="text-right font-semibold text-gray-900">{formatCurrency(r.amount)}</span>
            </Link>
          ))}
      </div>
      <p className="mt-3 text-sm text-gray-400">{recs.length} Total</p>
    </>
  );
}

function RefundsTab() {
  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Paid" value={formatCurrency(0)} />
        <StatCard label="Pending" value={formatCurrency(0)} />
      </div>
      <div className="card flex flex-col items-center justify-center py-16 text-center text-gray-400">
        {Icons.search({ className: "h-8 w-8" })}
        <p className="mt-2 font-medium text-gray-500">No results found</p>
        <p className="text-sm">Refunds you issue will appear here.</p>
      </div>
    </>
  );
}
