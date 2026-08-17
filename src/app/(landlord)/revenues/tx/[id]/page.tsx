import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Badge, Avatar } from "@/components/ui";
import { Icons } from "@/components/icons";
import { RecordPaymentButton } from "../../RecordPaymentButton";

function shortId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) % 100000000;
  return String(h).padStart(8, "0");
}

export default async function TransactionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("LANDLORD");
  const isInvoice = id.startsWith("inv-");
  const realId = id.replace(/^(inv|inc)-/, "");

  if (isInvoice) {
    const inv = await db.invoice.findFirst({
      where: { id: realId, lease: { unit: { property: { landlordId: user.id } } } },
      include: { lease: { include: { tenant: true, unit: { include: { property: true } } } }, payments: { orderBy: { paidAt: "desc" } } },
    });
    if (!inv) notFound();
    const paidAmt = inv.payments.reduce((s, p) => s + p.amount, 0);
    return (
      <TxLayout
        title={inv.memo ?? inv.type} amount={inv.amount} status={inv.status} dueDate={inv.dueDate}
        paid={inv.status === "PAID" ? inv.amount : paidAmt} payer={inv.lease.tenant.name}
        txId={shortId(inv.id)} type={`Income / ${inv.type}`}
        summary={[
          ["Property", inv.lease.unit.property.name], ["Unit", inv.lease.unit.label],
          ["Tenant", inv.lease.tenant.name], ["Details", inv.memo ?? inv.type],
        ]}
        payments={inv.payments.map((p) => ({ date: p.paidAt, amount: p.amount, who: inv.lease.tenant.name }))}
        payAction={inv.status !== "PAID" && inv.status !== "VOID" ? <RecordPaymentButton invoiceId={inv.id} /> : undefined}
      />
    );
  }

  const inc = await db.income.findFirst({ where: { id: realId, landlordId: user.id }, include: { property: true } });
  if (!inc) notFound();
  return (
    <TxLayout
      title={inc.subcategory ?? inc.category} amount={inc.amount} status={inc.status} dueDate={inc.dueDate}
      paid={inc.status === "PAID" ? inc.amount : 0} payer={inc.payer ?? "—"}
      txId={shortId(inc.id)} type={`${inc.category} / One time`}
      summary={[["Category", inc.category], ["Subcategory", inc.subcategory ?? "—"], ["Property", inc.property?.name ?? "General"], ["Details", inc.details ?? "—"]]}
      payments={inc.status === "PAID" ? [{ date: inc.createdAt, amount: inc.amount, who: inc.payer ?? "—" }] : []}
    />
  );
}

function TxLayout({
  title, amount, status, dueDate, paid, payer, txId, type, summary, payments, payAction,
}: {
  title: string; amount: number; status: string; dueDate: Date; paid: number; payer: string;
  txId: string; type: string; summary: [string, string][]; payments: { date: Date; amount: number; who: string }[]; payAction?: React.ReactNode;
}) {
  const left = Math.max(amount - paid, 0);
  const pct = amount ? Math.round((paid / amount) * 100) : 0;
  return (
    <div className="max-w-4xl">
      <div className="mb-3 text-sm text-gray-400">
        <Link href="/revenues" className="text-brand-600 hover:underline">Revenues</Link> / <span className="text-gray-700">Details</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/revenues" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">Transaction</h1>
        </div>
        <div className="flex items-center gap-2">{payAction}</div>
      </div>

      <div className="card mb-6 p-6">
        <p className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          {Icons.calendar({ className: "h-5 w-5 text-gray-400" })} Due on {formatDate(dueDate)}
        </p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{title} for {formatCurrency(amount)} <span className="ml-2 align-middle"><Badge status={status} /></span></p>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 flex justify-between text-sm text-gray-500">
          <span>{formatCurrency(left)} Left</span><span>{formatCurrency(paid)} Paid</span>
        </div>

        <div className="mt-6">
          <p className="mb-2 flex items-center gap-2 font-semibold text-gray-900">{Icons.renters({ className: "h-4 w-4 text-gray-400" })} Payer</p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"><Avatar name={payer} /><span className="text-sm font-medium text-gray-800">{payer}</span></div>
        </div>
      </div>

      <div className="card mb-6 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">{Icons.reports({ className: "h-5 w-5 text-gray-400" })} Summary <span className="text-sm font-normal text-gray-400">(details)</span></h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <div className="flex justify-between border-b border-gray-50 pb-1"><dt className="text-sm text-gray-500">Transaction ID</dt><dd className="text-sm font-medium text-gray-900">{txId}</dd></div>
          <div className="flex justify-between border-b border-gray-50 pb-1"><dt className="text-sm text-gray-500">Type</dt><dd className="text-sm font-medium text-gray-900">{type}</dd></div>
          {summary.map(([k, v]) => <div key={k} className="flex justify-between border-b border-gray-50 pb-1"><dt className="text-sm text-gray-500">{k}</dt><dd className="text-sm font-medium text-gray-900">{v}</dd></div>)}
        </dl>
      </div>

      <div className="card mb-6 p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">{Icons.dollar({ className: "h-5 w-5 text-gray-400" })} Payments &amp; Activity <span className="text-sm font-normal text-gray-400">({payments.length} record{payments.length !== 1 ? "s" : ""})</span></h2>
        {payments.length === 0 ? <p className="py-4 text-center text-sm text-gray-400">No payments yet.</p> : (
          <ul className="space-y-2">
            {payments.map((p, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
                <span className="flex items-center gap-2 text-gray-700">{Icons.check({ className: "h-4 w-4 text-green-600" })}{formatDate(p.date)} · <span className="text-green-700">Success</span></span>
                <span className="font-medium text-gray-900">{formatCurrency(p.amount)} · {p.who}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">{Icons.documents({ className: "h-5 w-5 text-gray-400" })} Attachments <span className="text-sm font-normal text-gray-400">(0 records)</span></h2>
      </div>
    </div>
  );
}
