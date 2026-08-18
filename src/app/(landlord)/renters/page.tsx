import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, nextDueDate, daysUntil, cn } from "@/lib/utils";
import { PageHeader, StatCard, Badge, Avatar, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { Icons } from "@/components/icons";
import { AddTenantButton } from "./AddTenantButton";
import { BalanceActions } from "./BalanceActions";
import { TenantMenu } from "./TenantMenu";

export default async function RentersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sub?: string }>;
}) {
  const { tab = "leases", sub = "open" } = await searchParams;
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

  // All tenants this landlord manages (with or without a lease).
  const tenants = await db.user.findMany({
    where: { role: "TENANT", OR: [{ managedById: user.id }, { leases: { some: { unit: { property: { landlordId: user.id } } } } }] },
    include: { leases: { where: { status: "ACTIVE" }, include: { unit: { include: { property: true } } } } },
    orderBy: { name: "asc" },
  });

  const tabs = [
    { key: "leases", label: "Leases", href: "/renters" },
    { key: "occupancy", label: "Occupancy Board", href: "/renters?tab=occupancy" },
    { key: "balances", label: "Balances", href: "/renters?tab=balances" },
    { key: "renters", label: "Renters", href: "/renters?tab=renters" },
  ];

  return (
    <div>
      <PageHeader
        title="Renters"
        action={
          tab === "renters"
            ? <Link href="/renters/new" className="btn-primary">{Icons.plus({ className: "h-4 w-4" })}Add tenant</Link>
            : <div className="flex gap-2">
                {tab === "leases" && <Link href="/renters/move-in" className="btn-primary">{Icons.plus({ className: "h-4 w-4" })}Move in</Link>}
                <AddTenantButton vacantUnits={vacantUnits} />
              </div>
        }
      />
      <Tabs tabs={tabs} active={tab} />

      {tab === "leases" && <LeasesTab leases={allLeases} activeCount={activeLeases.length} />}
      {tab === "occupancy" && <OccupancyTab properties={properties} />}
      {tab === "balances" && <BalancesTab leases={activeLeases} sub={sub} />}
      {tab === "renters" && <RentersTab tenants={tenants} />}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function LeasesTab({ leases, activeCount }: { leases: any[]; activeCount: number }) {
  const expiringSoon = leases.filter((l) => l.status === "ACTIVE" && daysUntil(l.endDate) <= 30 && daysUntil(l.endDate) >= 0).length;
  const scheduled = leases.filter((l) => l.status === "PENDING" || (l.status === "ACTIVE" && new Date(l.startDate) > new Date())).length;

  // Group leases by property, most leases first.
  const groups = new Map<string, { name: string; rows: any[] }>();
  for (const l of leases) {
    const g = groups.get(l.property.id) ?? { name: l.property.name, rows: [] as any[] };
    g.rows.push(l);
    groups.set(l.property.id, g);
  }
  const grouped = [...groups.values()].sort((a, b) => b.rows.length - a.rows.length);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Active leases" value={String(activeCount)} accent="green" />
        <StatCard label="Lease expiration" value={String(expiringSoon)} sub="In the upcoming 30 days" accent={expiringSoon ? "amber" : "brand"} />
        <StatCard label="Scheduled" value={String(scheduled)} sub="Future leases" />
      </div>

      {leases.length === 0 ? (
        <EmptyState title="No leases yet" hint="Click “Move in” to create the first lease." />
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.name}>
              <div className="mb-2 flex items-center gap-2">
                {Icons.building({ className: "h-4 w-4 text-gray-400" })}
                <h3 className="font-semibold text-gray-900">{g.name}</h3>
                <span className="text-sm text-gray-400">({g.rows.length} {g.rows.length === 1 ? "lease" : "leases"})</span>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-left text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Property & unit</th>
                      <th className="px-5 py-3 font-medium">Tenants</th>
                      <th className="px-5 py-3 font-medium">Duration</th>
                      <th className="px-5 py-3 font-medium text-right">Rent & schedule</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {g.rows.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3"><Link href={`/renters/leases/${l.id}`}><Badge status={l.status} /></Link></td>
                        <td className="px-5 py-3"><Link href={`/renters/leases/${l.id}`} className="text-gray-700 hover:text-brand-700">{l.property.name}, {l.unit.label}</Link></td>
                        <td className="px-5 py-3"><Link href={`/renters/${l.tenant.id}`} className="font-medium text-brand-700 hover:underline">{l.tenant.name}</Link></td>
                        <td className="px-5 py-3 text-gray-500">{formatDate(l.startDate)} – {formatDate(l.endDate)}</td>
                        <td className="px-5 py-3 text-right text-gray-900">{l.status === "ACTIVE" ? `${formatCurrency(l.rentAmount)}/m` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OccupancyTab({ properties }: { properties: any[] }) {
  // 14-month window: 2 months back to 12 months forward.
  const now = new Date();
  const winStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const winEnd = new Date(now.getFullYear(), now.getMonth() + 12, 1);
  const span = winEnd.getTime() - winStart.getTime();
  const months: Date[] = [];
  for (let d = new Date(winStart); d < winEnd; d.setMonth(d.getMonth() + 1)) months.push(new Date(d));
  const pct = (t: number) => Math.min(100, Math.max(0, ((t - winStart.getTime()) / span) * 100));
  const todayPct = pct(now.getTime());

  const allUnits = properties.flatMap((p: any) => p.units);
  const vacant = allUnits.filter((u: any) => u.status === "VACANT").length;
  const expiring = properties.flatMap((p: any) => p.units.flatMap((u: any) => u.leases)).filter((l: any) => l.status === "ACTIVE" && daysUntil(l.endDate) >= 0 && daysUntil(l.endDate) <= 60).length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-500">A color-coded timeline of every lease — spot move-ins, move-outs, renewals, and upcoming vacancies at a glance.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Units" value={String(allUnits.length)} />
        <StatCard label="Vacant now" value={String(vacant)} accent={vacant ? "amber" : "green"} />
        <StatCard label="Expiring in 60 days" value={String(expiring)} accent={expiring ? "amber" : "brand"} />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-green-500" /> Active</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-amber-400" /> Upcoming / renewal</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-sm bg-gray-300" /> Ended</span>
      </div>

      <div className="card overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Month header */}
          <div className="flex border-b border-gray-100 pl-56">
            <div className="relative flex-1">
              <div className="flex">
                {months.map((m, i) => (
                  <div key={i} className="flex-1 border-l border-gray-100 px-1 py-2 text-[10px] font-medium text-gray-400">{m.toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</div>
                ))}
              </div>
            </div>
          </div>

          {properties.map((p: any) => (
            <div key={p.id}>
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-2">
                {Icons.building({ className: "h-4 w-4 text-gray-400" })}
                <span className="text-sm font-semibold text-gray-900">{p.name}</span>
              </div>
              {p.units.map((u: any) => (
                <div key={u.id} className="flex items-center border-b border-gray-50">
                  <div className="w-56 shrink-0 px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{u.label}</p>
                    <p className="text-xs text-gray-400">{u.beds} bd · {formatCurrency(u.rent)}/mo</p>
                  </div>
                  <div className="relative h-9 flex-1">
                    {/* month gridlines */}
                    {months.map((_, i) => <div key={i} className="absolute top-0 h-full border-l border-gray-50" style={{ left: `${(i / months.length) * 100}%` }} />)}
                    {/* today marker */}
                    <div className="absolute top-0 z-10 h-full border-l-2 border-brand-400" style={{ left: `${todayPct}%` }} />
                    {/* lease bars */}
                    {u.leases.map((l: any) => {
                      const s = pct(new Date(l.startDate).getTime());
                      const e = pct(new Date(l.endDate).getTime());
                      const w = Math.max(e - s, 1.5);
                      if (e <= 0 || s >= 100) return null;
                      const future = new Date(l.startDate) > now;
                      const color = l.status === "ACTIVE" ? (future ? "bg-amber-400" : "bg-green-500") : "bg-gray-300";
                      return (
                        <Link key={l.id} href={`/renters/leases/${l.id}`} title={`${l.tenant.name} · ${formatDate(l.startDate)}–${formatDate(l.endDate)}`}
                          className={cn("absolute top-1.5 flex h-6 items-center overflow-hidden rounded px-2 text-[10px] font-medium text-white hover:opacity-90", color)}
                          style={{ left: `${s}%`, width: `${w}%` }}>
                          <span className="truncate">{l.tenant.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BalancesTab({ leases, sub }: { leases: any[]; sub: string }) {
  // Itemize each tenant's outstanding balance by charge type.
  const rows = leases.map((l) => {
    const open = l.invoices.filter((i: any) => i.status !== "PAID");
    const byType = (t: string) => open.filter((i: any) => i.type === t).reduce((s: number, i: any) => s + i.amount, 0);
    const balance = open.reduce((s: number, i: any) => s + i.amount, 0);
    const overdue = open.some((i: any) => i.status === "OVERDUE");
    return {
      lease: l, balance, overdue,
      rent: byType("RENT"), lateFee: byType("LATE_FEE"), utility: byType("UTILITY"), deposit: byType("DEPOSIT"), other: byType("OTHER"),
    };
  });

  const filtered = rows.filter((r) => {
    if (r.balance <= 0) return false;
    if (sub === "overdue") return r.overdue;
    return true; // open & partial
  });
  const totalOutstanding = filtered.reduce((s, r) => s + r.balance, 0);

  // Group by property.
  const groups = new Map<string, { name: string; rows: typeof filtered }>();
  for (const r of filtered) {
    const g = groups.get(r.lease.property.id) ?? { name: r.lease.property.name, rows: [] as any[] };
    g.rows.push(r);
    groups.set(r.lease.property.id, g);
  }

  const pills = [{ key: "open", label: "Open & Partial" }, { key: "overdue", label: "Overdue" }];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {pills.map((p) => (
          <Link key={p.key} href={`/renters?tab=balances${p.key === "open" ? "" : `&sub=${p.key}`}`}
            className={cn("rounded-lg px-4 py-1.5 text-sm font-medium", (sub || "open") === p.key ? "bg-gray-900 text-white" : "border border-gray-300 text-gray-600 hover:bg-gray-50")}>{p.label}</Link>
        ))}
        <span className="ml-auto text-sm text-gray-500">Total outstanding: <span className="font-semibold text-red-600">{formatCurrency(totalOutstanding)}</span></span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No outstanding balances 🎉" hint="Tenants with open or overdue invoices show up here." />
      ) : (
        <div className="space-y-6">
          {[...groups.values()].map((g) => (
            <div key={g.name}>
              <div className="mb-2 flex items-center gap-2">{Icons.building({ className: "h-4 w-4 text-gray-400" })}<h3 className="font-semibold text-gray-900">{g.name}</h3></div>
              <div className="card divide-y divide-gray-100">
                {g.rows.map((r) => (
                  <div key={r.lease.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link href={`/renters/${r.lease.tenant.id}`} className="flex items-center gap-3">
                        <Avatar name={r.lease.tenant.name} />
                        <div>
                          <p className="font-medium text-gray-900">{r.lease.tenant.name}</p>
                          <p className="text-xs text-gray-400">{r.lease.unit.label} · <span className={r.overdue ? "text-red-600" : ""}>{r.overdue ? "Overdue" : "Open"}</span></p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-bold text-red-600">{formatCurrency(r.balance)}</span>
                        <BalanceActions tenantId={r.lease.tenant.id} />
                      </div>
                    </div>
                    {/* Itemized breakdown */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {([["Rent", r.rent], ["Late fees", r.lateFee], ["Utilities", r.utility], ["Deposit", r.deposit], ["Other", r.other]] as [string, number][])
                        .filter(([, v]) => v > 0)
                        .map(([label, v]) => (
                          <span key={label} className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs text-gray-600">{label}: <span className="font-semibold text-gray-900">{formatCurrency(v)}</span></span>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RentersTab({ tenants }: { tenants: any[] }) {
  if (tenants.length === 0) return <EmptyState title="No renters yet" hint="Click “Add tenant” to add your first tenant." />;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {tenants.map((t) => {
        const lease = t.leases[0];
        return (
          <div key={t.id} className="card p-5">
            <div className="mb-2 flex items-center justify-between text-gray-300">
              {Icons.renters({ className: "h-4 w-4" })}
              <div className="flex items-center gap-1">{Icons.chat({ className: "h-4 w-4" })}<TenantMenu id={t.id} archived={t.archived} /></div>
            </div>
            <Link href={`/renters/${t.id}`} className="block text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-400 text-xl font-semibold text-white">
                {t.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
              </div>
              <p className="font-semibold text-gray-900">{t.name}{t.archived && <span className="ml-1 text-xs text-gray-400">(archived)</span>}</p>
            </Link>
            {t.phone && <p className="text-center text-xs text-brand-600 underline">{t.phone}</p>}
            <p className="mt-2 rounded bg-gray-50 px-2 py-1 text-center text-xs text-gray-600">{lease ? `${lease.unit.property.name}, ${lease.unit.label}` : "No lease"}</p>
            <Link href={`/renters/${t.id}`} className="mt-3 block border-t border-gray-100 pt-3 text-center text-sm font-medium text-brand-600 hover:underline">View profile</Link>
          </div>
        );
      })}
    </div>
  );
}
