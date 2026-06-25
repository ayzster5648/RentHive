import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, StatCard, Badge, EmptyState } from "@/components/ui";

const titles: Record<string, string> = {
  "rent-roll": "Rent Roll",
  contacts: "Contacts",
  maintenance: "Maintenance Requests",
  "tenant-statement": "Tenant Statement",
  "vacant-rentals": "Vacant Rentals",
  "income-statement": "Income Statement",
  "general-income": "General Income",
  "general-expenses": "General Expenses",
  "property-expenses": "Property Expenses",
};

function Table({ head, rows }: { head: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
          <tr>{head.map((h, i) => <th key={i} className={`px-5 py-3 font-medium ${i === head.length - 1 ? "text-right" : ""}`}>{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {r.map((c, j) => <td key={j} className={`px-5 py-3 ${j === r.length - 1 ? "text-right" : ""}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function ReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireRole("LANDLORD");
  const title = titles[slug];
  if (!title) notFound();

  const pid = { property: { landlordId: user.id } };

  let body: React.ReactNode = <EmptyState title="This report is coming soon" />;

  if (slug === "rent-roll") {
    const leases = await db.lease.findMany({
      where: { status: "ACTIVE", unit: pid },
      include: { tenant: true, unit: { include: { property: true } }, invoices: true },
    });
    const total = leases.reduce((s, l) => s + l.rentAmount, 0);
    body = (
      <>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard label="Active leases" value={String(leases.length)} />
          <StatCard label="Scheduled monthly rent" value={formatCurrency(total)} accent="green" />
        </div>
        <Table
          head={["Property / unit", "Tenant", "Rent", "Lease ends", "Balance"]}
          rows={leases.map((l) => {
            const bal = l.invoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + i.amount, 0);
            return [`${l.unit.property.name} · ${l.unit.label}`, l.tenant.name, `${formatCurrency(l.rentAmount)}/mo`, formatDate(l.endDate), bal > 0 ? <span className="font-medium text-red-600">{formatCurrency(bal)}</span> : formatCurrency(0)];
          })}
        />
      </>
    );
  } else if (slug === "contacts") {
    const tenants = await db.user.findMany({ where: { role: "TENANT", leases: { some: { unit: pid } } }, include: { leases: { include: { unit: true } } } });
    body = <Table head={["Name", "Email", "Phone", "Unit"]} rows={tenants.map((t) => [t.name, t.email, t.phone ?? "—", t.leases[0]?.unit.label ?? "—"])} />;
  } else if (slug === "maintenance") {
    const reqs = await db.maintenanceRequest.findMany({ where: { unit: pid }, include: { unit: { include: { property: true } }, tenant: true }, orderBy: { createdAt: "desc" } });
    body = <Table head={["Title", "Category", "Property / unit", "Priority", "Status"]} rows={reqs.map((r) => [r.title, r.category, `${r.unit.property.name} · ${r.unit.label}`, <Badge key="p" status={r.priority} />, <Badge key="s" status={r.status} />])} />;
  } else if (slug === "tenant-statement") {
    const invoices = await db.invoice.findMany({ where: { lease: { unit: pid } }, include: { lease: { include: { tenant: true } }, payments: true }, orderBy: { dueDate: "desc" }, take: 50 });
    body = <Table head={["Tenant", "Charge", "Due", "Paid", "Status"]} rows={invoices.map((i) => [i.lease.tenant.name, i.memo ?? i.type, formatDate(i.dueDate), i.payments[0] ? formatDate(i.payments[0].paidAt) : "—", <Badge key="s" status={i.status} />])} />;
  } else if (slug === "vacant-rentals") {
    const units = await db.unit.findMany({ where: { status: "VACANT", property: { landlordId: user.id } }, include: { property: true } });
    body = units.length === 0 ? <EmptyState title="No vacant units 🎉" /> : <Table head={["Property", "Unit", "Beds/Baths", "Market rent"]} rows={units.map((u) => [u.property.name, u.label, `${u.beds} / ${u.baths}`, `${formatCurrency(u.rent)}/mo`])} />;
  } else if (slug === "income-statement") {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const payments = await db.payment.findMany({ where: { paidAt: { gte: yearStart }, invoice: { lease: { unit: pid } } } });
    const expenses = await db.expense.findMany({ where: { date: { gte: yearStart }, status: "PAID", OR: [{ property: { landlordId: user.id } }, { propertyId: null }] } });
    const income = payments.reduce((s, p) => s + p.amount, 0);
    const expByCat = new Map<string, number>();
    for (const e of expenses) expByCat.set(e.category, (expByCat.get(e.category) ?? 0) + e.amount);
    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    body = (
      <>
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Income (YTD)" value={formatCurrency(income)} accent="green" />
          <StatCard label="Expenses (YTD)" value={formatCurrency(totalExp)} accent="red" />
          <StatCard label="Net operating income" value={formatCurrency(income - totalExp)} accent={income - totalExp >= 0 ? "green" : "red"} />
        </div>
        <Table
          head={["Category", "Type", "Amount"]}
          rows={[
            ["Rental income", "Income", <span key="i" className="font-medium text-green-700">{formatCurrency(income)}</span>],
            ...[...expByCat.entries()].map(([cat, amt]) => [cat, "Expense", <span key={cat} className="text-red-600">−{formatCurrency(amt)}</span>]),
          ]}
        />
      </>
    );
  } else if (slug === "general-income") {
    const payments = await db.payment.findMany({ where: { invoice: { lease: { unit: pid } } }, include: { invoice: { include: { lease: { include: { tenant: true } } } } }, orderBy: { paidAt: "desc" }, take: 50 });
    body = <Table head={["Date", "Tenant", "Method", "Amount"]} rows={payments.map((p) => [formatDate(p.paidAt), p.invoice.lease.tenant.name, p.method, <span key="a" className="font-medium text-green-700">+{formatCurrency(p.amount)}</span>])} />;
  } else if (slug === "general-expenses" || slug === "property-expenses") {
    const expenses = await db.expense.findMany({ where: { OR: [{ property: { landlordId: user.id } }, { propertyId: null }] }, include: { property: true }, orderBy: { date: "desc" } });
    body = <Table head={["Date", "Category", "Property", "Vendor", "Amount"]} rows={expenses.map((e) => [formatDate(e.date), e.category, e.property?.name ?? "Portfolio", e.vendor ?? "—", <span key="a" className="text-red-600">−{formatCurrency(e.amount)}</span>])} />;
  }

  return (
    <div>
      <Link href="/reports" className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back to reports</Link>
      <PageHeader title={title} subtitle="Generated from your live data." />
      {body}
    </div>
  );
}
