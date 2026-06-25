import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, nextDueDate, daysUntil, cn } from "@/lib/utils";
import { PageHeader, StatCard, Badge, Avatar, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { AddTenantButton } from "./AddTenantButton";

export default async function RentersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "leases" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const properties = await db.property.findMany({
    where: { landlordId: user.id },
    include: {
      units: {
        include: {
          leases: { include: { tenant: true, invoices: true }, orderBy: { startDate: "desc" } },
        },
        orderBy: { label: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const vacant = await db.unit.findMany({ where: { status: "VACANT", property: { landlordId: user.id } }, include: { property: true } });
  const vacantUnits = vacant.map((u) => ({ id: u.id, label: u.label, propertyName: u.property.name, rent: u.rent }));

  const allLeases = properties.flatMap((p) => p.units.flatMap((u) => u.leases.map((l) => ({ ...l, unit: u, property: p }))));
  const activeLeases = allLeases.filter((l) => l.status === "ACTIVE");

  const tabs = [
    { key: "leases", label: "Leases", href: "/renters" },
    { key: "occupancy", label: "Occupancy Board", href: "/renters?tab=occupancy" },
    { key: "balances", label: "Balances", href: "/renters?tab=balances" },
    { key: "renters", label: "Renters", href: "/renters?tab=renters" },
  ];

  return (
    <div>
      <PageHeader title="Renters" action={<AddTenantButton vacantUnits={vacantUnits} />} />
      <Tabs tabs={tabs} active={tab} />

      {tab === "leases" && <LeasesTab leases={allLeases} activeCount={activeLeases.length} />}
      {tab === "occupancy" && <OccupancyTab properties={properties} />}
      {tab === "balances" && <BalancesTab leases={activeLeases} />}
      {tab === "renters" && <RentersTab leases={activeLeases} />}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function LeasesTab({ leases, activeCount }: { leases: any[]; activeCount: number }) {
  const expiringSoon = leases.filter((l) => l.status === "ACTIVE" && daysUntil(l.endDate) <= 60 && daysUntil(l.endDate) >= 0).length;
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active leases" value={String(activeCount)} accent="green" />
        <StatCard label="Expiring in 60 days" value={String(expiringSoon)} accent={expiringSoon ? "amber" : "brand"} />
        <StatCard label="Total leases" value={String(leases.length)} />
      </div>
      {leases.length === 0 ? (
        <EmptyState title="No leases yet" hint="Add a tenant to create the first lease." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Property & unit</th>
                <th className="px-5 py-3 font-medium">Tenant</th>
                <th className="px-5 py-3 font-medium">Duration</th>
                <th className="px-5 py-3 font-medium">Rent & schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leases.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3"><Badge status={l.status} /></td>
                  <td className="px-5 py-3 text-gray-700">{l.property.name} · {l.unit.label}</td>
                  <td className="px-5 py-3">
                    <Link href={`/renters/${l.tenant.id}`} className="font-medium text-brand-700 hover:underline">{l.tenant.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                  <td className="px-5 py-3 text-gray-900">{formatCurrency(l.rentAmount)}/mo · day {l.rentDueDay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function OccupancyTab({ properties }: { properties: any[] }) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Color-coded occupancy across every unit. Spot vacancies and upcoming renewals at a glance.</p>
      {properties.map((p) => (
        <div key={p.id} className="card p-5">
          <h3 className="mb-3 font-semibold text-gray-900">{p.name}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {p.units.map((u: any) => {
              const lease = u.leases.find((l: any) => l.status === "ACTIVE");
              const color = u.status === "OCCUPIED" ? "border-green-200 bg-green-50" : u.status === "VACANT" ? "border-amber-200 bg-amber-50" : "border-orange-200 bg-orange-50";
              return (
                <div key={u.id} className={cn("rounded-lg border p-3", color)}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{u.label}</span>
                    <Badge status={u.status} />
                  </div>
                  {lease ? (
                    <div className="mt-2 text-xs text-gray-600">
                      <p className="font-medium text-gray-800">{lease.tenant.name}</p>
                      <p>Ends {formatDate(lease.endDate)}</p>
                      <p className={daysUntil(lease.endDate) <= 60 ? "text-amber-700" : ""}>{daysUntil(lease.endDate)} days left</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">No active lease · {formatCurrency(u.rent)}/mo</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BalancesTab({ leases }: { leases: any[] }) {
  const rows = leases.map((l) => ({
    lease: l,
    balance: l.invoices.filter((i: any) => i.status !== "PAID").reduce((s: number, i: any) => s + i.amount, 0),
  }));
  const totalOutstanding = rows.reduce((s, r) => s + r.balance, 0);
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Total outstanding" value={formatCurrency(totalOutstanding)} accent={totalOutstanding ? "red" : "green"} />
        <StatCard label="Tenants with balance" value={String(rows.filter((r) => r.balance > 0).length)} />
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-5 py-3 font-medium">Tenant</th>
              <th className="px-5 py-3 font-medium">Unit</th>
              <th className="px-5 py-3 font-medium">Outstanding balance</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map(({ lease: l, balance }) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <Link href={`/renters/${l.tenant.id}`} className="flex items-center gap-3">
                    <Avatar name={l.tenant.name} />
                    <span className="font-medium text-gray-900">{l.tenant.name}</span>
                  </Link>
                </td>
                <td className="px-5 py-3 text-gray-600">{l.property.name} · {l.unit.label}</td>
                <td className="px-5 py-3">{balance > 0 ? <span className="font-semibold text-red-600">{formatCurrency(balance)}</span> : <span className="text-gray-400">{formatCurrency(0)}</span>}</td>
                <td className="px-5 py-3">{balance > 0 ? <Badge status="OVERDUE" /> : <Badge status="PAID" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RentersTab({ leases }: { leases: any[] }) {
  if (leases.length === 0) return <EmptyState title="No renters yet" hint="Add a tenant to get started." />;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {leases.map((l) => {
        const due = nextDueDate(l.rentDueDay);
        return (
          <div key={l.id} className="card p-5 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
              {l.tenant.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
            </div>
            <p className="font-semibold text-gray-900">{l.tenant.name}</p>
            {l.tenant.phone && <p className="text-xs text-brand-600">{l.tenant.phone}</p>}
            <p className="mt-2 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">{l.property.name} · {l.unit.label}</p>
            <p className="mt-2 text-xs text-gray-400">Next rent due {formatDate(due)}</p>
            <Link href={`/renters/${l.tenant.id}`} className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">View profile</Link>
          </div>
        );
      })}
    </div>
  );
}
