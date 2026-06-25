import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { EditContactButton } from "./EditContactButton";
import { RecordPaymentButton } from "../../revenues/RecordPaymentButton";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

export default async function TenantProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "profile" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const tenant = await db.user.findUnique({ where: { id } });
  if (!tenant || tenant.role !== "TENANT") notFound();

  const leases = await db.lease.findMany({
    where: { tenantId: id, unit: { property: { landlordId: user.id } } },
    include: {
      unit: { include: { property: true } },
      invoices: { include: { payments: true }, orderBy: { dueDate: "desc" } },
    },
    orderBy: { startDate: "desc" },
  });
  if (leases.length === 0) notFound();

  const requests = await db.maintenanceRequest.findMany({
    where: { tenantId: id, unit: { property: { landlordId: user.id } } },
    include: { unit: true },
    orderBy: { createdAt: "desc" },
  });
  const applications = tenant.email
    ? await db.application.findMany({ where: { email: tenant.email }, include: { listing: { include: { unit: { include: { property: true } } } } } })
    : [];

  const active = leases.find((l) => l.status === "ACTIVE") ?? leases[0];
  const allInvoices = leases.flatMap((l) => l.invoices);
  const outstanding = allInvoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + i.amount, 0);
  const deposits = leases.filter((l) => l.status === "ACTIVE").reduce((s, l) => s + l.depositAmount, 0);
  const [firstName, ...rest] = tenant.name.split(" ");
  const lastName = rest.join(" ");

  const tabs = [
    { key: "profile", label: "Profile", href: `/renters/${id}` },
    { key: "leases", label: "Leases", href: `/renters/${id}?tab=leases` },
    { key: "transactions", label: "Transactions", href: `/renters/${id}?tab=transactions` },
    { key: "insurance", label: "Insurance", href: `/renters/${id}?tab=insurance` },
    { key: "applications", label: "Applications", href: `/renters/${id}?tab=applications` },
    { key: "requests", label: "Requests", href: `/renters/${id}?tab=requests`, badge: requests.length ? String(requests.length) : undefined },
  ];

  return (
    <div>
      <Link href="/renters?tab=renters" className="mb-4 inline-block text-sm text-brand-600 hover:underline">← Back to renters</Link>
      <PageHeader title={tenant.name} subtitle={`${active.unit.property.name} · ${active.unit.label}`} action={<EditContactButton tenant={tenant} />} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sidebar card */}
        <div className="space-y-4">
          <div className="card p-5 text-center">
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-2xl font-semibold text-brand-700">
              {tenant.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <p className="text-lg font-semibold text-gray-900">{tenant.name}</p>
            {tenant.phone && <p className="text-sm text-brand-600">{tenant.phone}</p>}
            <a href={`mailto:${tenant.email}`} className="text-sm text-gray-500 hover:underline">{tenant.email}</a>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="card p-3 text-center"><p className="text-xs text-gray-400">Outstanding</p><p className={`mt-1 text-sm font-bold ${outstanding > 0 ? "text-red-600" : "text-gray-900"}`}>{formatCurrency(outstanding)}</p></div>
            <div className="card p-3 text-center"><p className="text-xs text-gray-400">Deposits</p><p className="mt-1 text-sm font-bold text-gray-900">{formatCurrency(deposits)}</p></div>
            <div className="card p-3 text-center"><p className="text-xs text-gray-400">Credits</p><p className="mt-1 text-sm font-bold text-gray-900">{formatCurrency(0)}</p></div>
          </div>

          <div className="card p-5">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Reports</h3>
            <Link href="/reports/tenant-statement" className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm hover:bg-gray-50">
              <span className="text-gray-700">Tenant Statement</span>
              <span className="text-xs font-medium text-brand-600">View</span>
            </Link>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2">
          <Tabs tabs={tabs} active={tab} />

          {tab === "profile" && (
            <div className="space-y-6">
              <Section title="Personal information">
                <Grid>
                  <Field label="First name" value={firstName} />
                  <Field label="Email" value={tenant.email} />
                  <Field label="Last name" value={lastName || "—"} />
                  <Field label="Phone" value={tenant.phone ?? "—"} />
                </Grid>
              </Section>
              <Section title="Forwarding address">
                <p className="text-sm text-gray-900">{active.unit.property.address}, {active.unit.property.city}, {active.unit.property.state} {active.unit.property.zip}</p>
              </Section>
              <Section title="Emergency contacts">
                {tenant.emergencyContact ? <p className="text-sm text-gray-900">{tenant.emergencyContact}</p> : <p className="text-sm text-gray-400">No emergency contact on file.</p>}
              </Section>
              <Section title="Notes">
                {tenant.notes ? <p className="whitespace-pre-wrap text-sm text-gray-900">{tenant.notes}</p> : <p className="text-sm text-gray-400">No notes.</p>}
              </Section>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Section title="Pets"><p className="py-2 text-center text-sm text-gray-400">No pets on file.</p></Section>
                <Section title="Vehicles"><p className="py-2 text-center text-sm text-gray-400">No vehicles on file.</p></Section>
              </div>
            </div>
          )}

          {tab === "leases" && (
            <div className="space-y-3">
              {leases.map((l) => (
                <div key={l.id} className="card p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{l.unit.property.name} · {l.unit.label}</p>
                    <Badge status={l.status} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600 sm:grid-cols-4">
                    <span>{formatDate(l.startDate)} – {formatDate(l.endDate)}</span>
                    <span>{formatCurrency(l.rentAmount)}/mo</span>
                    <span>Due {l.rentDueDay}{ordinal(l.rentDueDay)}</span>
                    <span>Deposit {formatCurrency(l.depositAmount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "transactions" && (
            allInvoices.length === 0 ? <EmptyState title="No transactions" /> : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                    <tr><th className="px-5 py-3 font-medium">Charge</th><th className="px-5 py-3 font-medium">Due</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{inv.memo ?? inv.type}</td>
                        <td className="px-5 py-3 text-gray-600">{formatDate(inv.dueDate)}</td>
                        <td className="px-5 py-3 text-gray-900">{formatCurrency(inv.amount)}</td>
                        <td className="px-5 py-3"><Badge status={inv.status} /></td>
                        <td className="px-5 py-3 text-right">{inv.status !== "PAID" && <RecordPaymentButton invoiceId={inv.id} />}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {tab === "insurance" && <EmptyState title="No renters insurance on file" hint="Insurance policies the tenant adds will appear here." />}

          {tab === "applications" && (
            applications.length === 0 ? <EmptyState title="No applications" hint="Applications submitted by this person will appear here." /> : (
              <div className="space-y-3">
                {applications.map((a) => (
                  <div key={a.id} className="card flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-gray-900">{a.listing ? `${a.listing.unit.property.name} · ${a.listing.unit.label}` : "General application"}</p>
                      <p className="text-xs text-gray-400">{formatDate(a.createdAt)} · {a.stage.toLowerCase()}</p>
                    </div>
                    <Badge status={a.status} />
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "requests" && (
            requests.length === 0 ? <EmptyState title="No maintenance requests" /> : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <div key={r.id} className="card flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{r.title}</p>
                        <Badge status={r.priority} />
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">{r.unit.label} · {r.category} · {formatDate(r.createdAt)}</p>
                    </div>
                    <Badge status={r.status} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="mb-3 font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">{children}</dl>;
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-50 pb-1">
      <dt className="text-sm text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
