import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Badge, Avatar, EmptyState } from "@/components/ui";
import { Icons } from "@/components/icons";

function shortNo(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 10000000;
  return h;
}
function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

const UTILITIES = [
  { key: "Electricity", icon: "revenues" }, { key: "Gas", icon: "wrench" },
  { key: "Water", icon: "expenses" }, { key: "Internet", icon: "chat" },
  { key: "Sewer", icon: "reconciliation" }, { key: "Trash", icon: "downloads" },
] as const;

export default async function LeaseDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "tenants" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const lease = await db.lease.findFirst({
    where: { id, unit: { property: { landlordId: user.id } } },
    include: {
      tenant: true,
      unit: { include: { property: true } },
      invoices: { include: { payments: true }, orderBy: { dueDate: "desc" } },
      recurring: true,
    },
  });
  if (!lease) notFound();

  const active = lease.status === "ACTIVE";
  const leaseNo = shortNo(lease.id);
  const rec = lease.recurring[0];
  const next = rec ? new Date(rec.nextDate) : null;

  const tabs = [
    { key: "tenants", label: "Tenants" },
    { key: "transactions", label: "Lease transactions" },
    { key: "agreements", label: "Agreements & Notices" },
    { key: "insurance", label: "Insurance" },
    { key: "utilities", label: "Utilities" },
  ];

  return (
    <div>
      <div className="mb-3 text-sm text-gray-400">
        <Link href="/renters" className="text-brand-600 hover:underline">Leases</Link> / <span className="text-gray-700">#{shortNo(lease.id) % 100}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/renters" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-2xl font-bold text-gray-900">No.{leaseNo}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/renters" className="btn-secondary">Renew</Link>
          <Link href={`/renters/${lease.tenant.id}`} className="btn-secondary">Actions ▾</Link>
        </div>
      </div>

      {/* Header card */}
      <div className="card mb-6 flex flex-wrap items-start justify-between gap-6 p-6">
        <div>
          <p className="flex items-center gap-2 text-lg font-semibold text-gray-800">{Icons.calendar({ className: "h-5 w-5 text-gray-400" })} {formatDate(lease.startDate)} — {formatDate(lease.endDate)}</p>
          <p className="mt-2 text-xl font-bold text-gray-900">Lease #{leaseNo % 100} <span className="ml-2 align-middle"><Badge status={active ? "ACTIVE" : "ENDED"} /></span></p>
          <div className="mt-4">
            <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-gray-700">{Icons.home({ className: "h-4 w-4 text-gray-400" })} Property</p>
            <span className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800">{Icons.building({ className: "h-4 w-4 text-gray-400" })} {lease.unit.property.name}, {lease.unit.label}</span>
          </div>
        </div>
        <div className="w-full max-w-xs rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-semibold text-gray-900">{Icons.dollar({ className: "h-4 w-4 text-amber-600" })} Collect rent</span>
            <Link href="/settings/integrations" className="text-sm font-medium text-brand-600">Set up</Link>
          </div>
          <p className="mt-2 text-sm text-gray-600">Start accepting rent and lease payments — ACH, debit, credit cards, and tenant autopay.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
        {tabs.map((t) => (
          <Link key={t.key} href={`/renters/leases/${id}${t.key === "tenants" ? "" : `?tab=${t.key}`}`} className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm font-medium", t.key === tab ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800")}>{t.label}</Link>
        ))}
      </div>

      {tab === "tenants" && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Tenant information <span className="text-sm font-normal text-gray-400">(1 record)</span></h2>
            <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-4">
              <Avatar name={lease.tenant.name} />
              <div>
                <Link href={`/renters/${lease.tenant.id}`} className="font-medium text-gray-900 hover:text-brand-700">{lease.tenant.name}</Link>
                <p className="text-xs text-brand-600">{lease.tenant.email}</p>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700">Details</p>
              <p className="text-sm text-gray-600">{lease.status === "ACTIVE" ? "Active" : "Ended"} lease · {formatCurrency(lease.rentAmount)}/mo · due {lease.rentDueDay}{ordinal(lease.rentDueDay)}.</p>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Dependents <span className="text-sm font-normal text-gray-400">(0 records)</span></h2>
              <span className="text-sm font-medium text-gray-400">Add dependent</span>
            </div>
          </div>
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-gray-900">Recurring rent <span className="text-sm font-normal text-gray-400">({rec ? 1 : 0} record)</span></h2>
            {rec ? (
              <div className="overflow-hidden rounded-lg border border-gray-100">
                <div className="grid grid-cols-[90px_120px_1fr_120px_140px] gap-4 border-b border-gray-100 bg-gray-50 px-4 py-2.5 text-xs font-medium uppercase text-gray-400">
                  <span>Status</span><span>First invoice</span><span>Category</span><span>Next invoice</span><span className="text-right">Total &amp; schedule</span>
                </div>
                <div className="grid grid-cols-[90px_120px_1fr_120px_140px] items-center gap-4 px-4 py-3 text-sm">
                  <Badge status={rec.status === "ACTIVE" ? "ACTIVE" : "ENDED"} />
                  <span className="text-gray-600">{formatDate(rec.startDate)}</span>
                  <span className="text-gray-700">{rec.category}</span>
                  <span className="text-gray-600">{next ? formatDate(next) : "—"}</span>
                  <span className="text-right"><span className="font-semibold text-gray-900">{formatCurrency(rec.amount)}</span><br /><span className="text-xs text-gray-400">Monthly</span></span>
                </div>
              </div>
            ) : <p className="py-4 text-center text-sm text-gray-400">No recurring rent set up.</p>}
          </div>
          <div className="card p-6">
            <div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">Other recurring transactions <span className="text-sm font-normal text-gray-400">(0 records)</span></h2><span className="text-sm font-medium text-gray-400">Add recurring transaction</span></div>
          </div>
          <div className="card p-6">
            <h2 className="mb-3 font-semibold text-gray-900">Extra fees</h2>
            <div className="rounded-lg border border-gray-100">
              <p className="border-b border-gray-100 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">Late fee</p>
              <p className="px-4 py-3 text-sm text-gray-600">One time · {formatCurrency(100)} fixed amount</p>
            </div>
          </div>
        </div>
      )}

      {tab === "agreements" && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2"><h2 className="font-semibold text-gray-900">Lease agreements</h2><Link href="/documents" className="text-sm font-medium text-brand-600">Request</Link></div>
            <p className="mt-1 text-sm text-gray-500">Build a lease addendum, get a state-specific agreement, and request an electronic signature.</p>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-100 p-4 text-sm text-gray-500">{Icons.documents({ className: "h-6 w-6 text-brand-300" })} No lease agreements requested.</div>
          </div>
          <div className="card p-6">
            <div className="flex items-center gap-2"><h2 className="font-semibold text-gray-900">Notices</h2><Link href="/documents" className="text-sm font-medium text-brand-600">Send</Link></div>
            <p className="mt-1 text-sm text-gray-500">Send notices through ready-to-use templates, then request a digital signature.</p>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-100 p-4 text-sm text-gray-500">{Icons.documents({ className: "h-6 w-6 text-brand-300" })} 0 notices signature pending.</div>
          </div>
          <div className="card p-6"><div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">Attachments <span className="text-sm font-normal text-gray-400">(0 records)</span></h2><span className="text-sm font-medium text-gray-400">Upload</span></div></div>
        </div>
      )}

      {tab === "insurance" && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-2"><h2 className="font-semibold text-gray-900">Insurance</h2><span className="text-sm font-medium text-brand-600">Request</span></div>
            <p className="mt-1 text-sm text-gray-500">Require your tenants to carry renters insurance to protect their belongings and liability.</p>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-gray-100 p-4 text-sm text-gray-500">{Icons.reconciliation({ className: "h-6 w-6 text-brand-300" })} No insurance requested.</div>
          </div>
          <div className="card p-6"><h2 className="font-semibold text-gray-900">Renters insurance <span className="text-sm font-normal text-gray-400">(0 records)</span></h2></div>
        </div>
      )}

      {tab === "utilities" && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold text-gray-900">Utility providers</h2><span className="text-sm font-medium text-gray-400">Configure utilities</span></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {UTILITIES.map((u, i) => {
                const Icon = Icons[u.icon];
                const status = i < 4 ? "Awaiting tenant" : "Disabled";
                return (
                  <div key={u.key} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
                    <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50"><Icon className="h-4 w-4 text-brand-600" /></span><span className="font-medium text-gray-900">{u.key}</span></div>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", i < 4 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")}>{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card p-6"><div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">Responsibility <span className="text-sm font-normal text-gray-400">(0 records)</span></h2><span className="text-sm font-medium text-gray-400">Add responsibility</span></div></div>
        </div>
      )}
    </div>
  );
}
