import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { Icons } from "@/components/icons";
import { AddPropertyButton } from "./AddPropertyButton";

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "properties" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const properties = await db.property.findMany({
    where: { landlordId: user.id },
    include: {
      units: { include: { leases: { where: { status: "ACTIVE" }, include: { tenant: true, invoices: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const tabs = [
    { key: "properties", label: "Properties", href: "/portfolio" },
    { key: "units", label: "Units", href: "/portfolio?tab=units" },
  ];

  return (
    <div>
      <PageHeader title="Portfolio" subtitle={`${properties.length} properties`} action={<AddPropertyButton />} />
      <Tabs tabs={tabs} active={tab} />

      {tab === "properties" ? (
        properties.length === 0 ? (
          <EmptyState title="No properties yet" hint="Add your first property to get started." />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((p) => {
              const occupied = p.units.filter((u) => u.status === "OCCUPIED").length;
              const balance = p.units.flatMap((u) => u.leases).flatMap((l) => l.invoices).filter((i) => i.status !== "PAID").reduce((s, i) => s + i.amount, 0);
              const occPct = p.units.length ? Math.round((occupied / p.units.length) * 100) : 0;
              return (
                <Link key={p.id} href={`/portfolio/${p.id}`} className="card overflow-hidden transition-shadow hover:shadow-md">
                  <div className="relative flex h-36 items-center justify-center bg-brand-50">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                    ) : (
                      Icons.building({ className: "h-12 w-12 text-brand-300" })
                    )}
                    <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-700">
                      Balance {formatCurrency(balance)}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900">{p.name}</h3>
                      <span className="text-sm font-medium text-brand-700">{occPct}%</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{p.address}, {p.city}, {p.state}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
                      <span>{p.units.length} unit{p.units.length !== 1 ? "s" : ""}</span>
                      <span className="flex gap-3">
                        <span className="inline-flex items-center gap-1">{Icons.transactions({ className: "h-3.5 w-3.5" })} Accounting</span>
                        <span className="inline-flex items-center gap-1">{Icons.renters({ className: "h-3.5 w-3.5" })} Tenants</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-5">
          {properties.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-5 py-3">
                {Icons.building({ className: "h-5 w-5 text-gray-400" })}
                <div>
                  <p className="font-semibold text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.address}, {p.city}, {p.state} {p.zip}</p>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {p.units.map((u) => {
                  const tenant = u.leases[0]?.tenant;
                  return (
                    <div key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">{Icons.home({ className: "h-5 w-5 text-gray-400" })}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{u.label}</p>
                            <Badge status={u.status} />
                          </div>
                          <p className="text-xs uppercase text-gray-400">{p.type}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{u.beds} bd · {u.baths} ba{u.sqft ? ` · ${u.sqft} sqft` : ""}{tenant ? ` · ${tenant.name}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(u.rent)} <span className="text-xs font-normal text-gray-400">market rent</span></span>
                        <Link href={`/portfolio/${p.id}`} className="btn-secondary px-3 py-1.5 text-sm">View unit</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
