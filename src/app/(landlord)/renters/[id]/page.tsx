import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, nextDueDate, daysUntil } from "@/lib/utils";
import { PageHeader, StatCard, Badge, Avatar, EmptyState } from "@/components/ui";
import { EditContactButton } from "./EditContactButton";
import { RecordPaymentButton } from "../../revenues/RecordPaymentButton";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireRole("LANDLORD");

  const tenant = await db.user.findUnique({ where: { id } });
  if (!tenant || tenant.role !== "TENANT") notFound();

  // Leases for this tenant on the current landlord's units.
  const leases = await db.lease.findMany({
    where: { tenantId: id, unit: { property: { landlordId: user.id } } },
    include: {
      unit: { include: { property: true } },
      invoices: { include: { payments: true }, orderBy: { dueDate: "desc" } },
    },
    orderBy: { startDate: "desc" },
  });

  if (leases.length === 0) notFound();

  const active = leases.find((l) => l.status === "ACTIVE") ?? leases[0];
  const allInvoices = leases.flatMap((l) => l.invoices);
  const balance = allInvoices
    .filter((i) => i.status !== "PAID")
    .reduce((s, i) => s + i.amount, 0);
  const due = nextDueDate(active.rentDueDay);
  const days = daysUntil(due);

  return (
    <div>
      <Link href="/renters" className="mb-4 inline-block text-sm text-brand-600 hover:underline">
        ← Back to renters
      </Link>

      <PageHeader
        title={tenant.name}
        subtitle={`${active.unit.property.name} · ${active.unit.label}`}
        action={<EditContactButton tenant={tenant} />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Monthly rent" value={formatCurrency(active.rentAmount)} />
        <StatCard
          label="Next rent due"
          value={formatDate(due)}
          sub={days === 0 ? "Due today" : days < 0 ? `${-days} days overdue` : `in ${days} days`}
          accent={days <= 3 ? "amber" : "brand"}
        />
        <StatCard
          label="Balance"
          value={formatCurrency(balance)}
          accent={balance > 0 ? "red" : "green"}
          sub={balance > 0 ? "Outstanding" : "Paid up"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact card */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={tenant.name} />
            <div>
              <p className="font-semibold text-gray-900">{tenant.name}</p>
              <p className="text-xs text-gray-400">Tenant</p>
            </div>
          </div>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-400">Email</dt>
              <dd className="text-gray-900">
                <a href={`mailto:${tenant.email}`} className="hover:underline">{tenant.email}</a>
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Phone</dt>
              <dd className="text-gray-900">
                {tenant.phone ? <a href={`tel:${tenant.phone}`} className="hover:underline">{tenant.phone}</a> : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Emergency contact</dt>
              <dd className="text-gray-900">{tenant.emergencyContact ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Notes</dt>
              <dd className="whitespace-pre-wrap text-gray-900">{tenant.notes ?? "—"}</dd>
            </div>
          </dl>
        </div>

        {/* Lease + payment history */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Lease</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-gray-400">Property</dt><dd className="text-gray-900">{active.unit.property.name}</dd></div>
              <div><dt className="text-gray-400">Unit</dt><dd className="text-gray-900">{active.unit.label}</dd></div>
              <div><dt className="text-gray-400">Term</dt><dd className="text-gray-900">{formatDate(active.startDate)} – {formatDate(active.endDate)}</dd></div>
              <div><dt className="text-gray-400">Rent due day</dt><dd className="text-gray-900">{active.rentDueDay}{ordinal(active.rentDueDay)} of the month</dd></div>
              <div><dt className="text-gray-400">Deposit</dt><dd className="text-gray-900">{formatCurrency(active.depositAmount)}</dd></div>
              <div><dt className="text-gray-400">Status</dt><dd><Badge status={active.status} /></dd></div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-gray-900">Rent history</h2>
            {allInvoices.length === 0 ? (
              <EmptyState title="No invoices yet" />
            ) : (
              <ul className="divide-y divide-gray-100">
                {allInvoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.memo ?? inv.type}</p>
                      <p className="text-xs text-gray-400">
                        Due {formatDate(inv.dueDate)}
                        {inv.payments[0] && ` · paid ${formatDate(inv.payments[0].paidAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(inv.amount)}</span>
                      <Badge status={inv.status} />
                      {inv.status !== "PAID" && <RecordPaymentButton invoiceId={inv.id} />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}
