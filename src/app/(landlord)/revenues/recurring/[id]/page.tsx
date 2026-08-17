import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, Avatar } from "@/components/ui";
import { Icons } from "@/components/icons";
import { RecurringActions } from "./RecurringActions";

function shortId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 33 + id.charCodeAt(i)) % 10000000;
  return String(h);
}

export default async function RecurringDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("LANDLORD");
  const rec = await db.recurringInvoice.findFirst({
    where: { id, lease: { unit: { property: { landlordId: user.id } } } },
    include: { lease: { include: { tenant: true, unit: { include: { property: true } } } } },
  });
  if (!rec) notFound();
  const active = rec.status === "ACTIVE";

  return (
    <div className="max-w-4xl">
      <div className="mb-3 text-sm text-gray-400">
        <Link href="/revenues?tab=recurring" className="text-brand-600 hover:underline">Recurring invoices</Link> / <span className="text-gray-700">Details</span>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/revenues?tab=recurring" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-bold text-gray-900">Recurring</h1>
        </div>
        <RecurringActions id={rec.id} active={active} />
      </div>

      <div className="card mb-6 p-6">
        <p className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          {Icons.calendar({ className: "h-5 w-5 text-gray-400" })} {formatDate(rec.startDate)} — {rec.endDate ? formatDate(rec.endDate) : "ongoing"}
        </p>
        <p className="mt-2 text-2xl font-bold text-gray-900">{rec.category} for {formatCurrency(rec.amount)} <span className="ml-2 align-middle"><Badge status={active ? "ACTIVE" : "ENDED"} /></span></p>

        <div className="mt-6">
          <p className="mb-2 flex items-center gap-2 font-semibold text-gray-900">{Icons.renters({ className: "h-4 w-4 text-gray-400" })} Payer</p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2"><Avatar name={rec.lease.tenant.name} /><span className="text-sm font-medium text-gray-800">{rec.lease.tenant.name}</span></div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">{Icons.reports({ className: "h-5 w-5 text-gray-400" })} Summary <span className="text-sm font-normal text-gray-400">(details)</span></h2>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          {[
            ["Property", rec.lease.unit.property.name], ["Unit", rec.lease.unit.label],
            ["Transaction ID", shortId(rec.id)], ["Type", "Income / Recurring Monthly"],
            ["Next invoice", active ? formatDate(rec.nextDate) : "—"], ["Details", rec.details ?? rec.category],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-gray-50 pb-1"><dt className="text-sm text-gray-500">{k}</dt><dd className="text-sm font-medium text-gray-900">{v}</dd></div>
          ))}
        </dl>
      </div>
    </div>
  );
}
