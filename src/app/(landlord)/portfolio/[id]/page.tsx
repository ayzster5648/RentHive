import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { Icons } from "@/components/icons";
import { TrackView } from "@/components/TrackView";
import { AddUnitButton } from "./AddUnitButton";

// Stable short display number from the cuid.
function shortNo(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 100000;
  return h;
}

export default async function PropertyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "summary" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const property = await db.property.findFirst({
    where: { id, landlordId: user.id },
    include: {
      units: {
        include: { leases: { where: { status: "ACTIVE" }, include: { tenant: true, invoices: { include: { payments: true } } } } },
        orderBy: { label: "asc" },
      },
    },
  });
  if (!property) notFound();

  const occupied = property.units.filter((u) => u.status === "OCCUPIED").length;
  const vacant = property.units.length - occupied;
  const occPct = property.units.length ? Math.round((occupied / property.units.length) * 100) : 0;
  const tenants = property.units.flatMap((u) => u.leases).map((l) => l.tenant);
  const invoices = property.units.flatMap((u) => u.leases).flatMap((l) => l.invoices).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const tabs = [
    { key: "summary", label: "Summary", href: `/portfolio/${id}` },
    { key: "utilities", label: "Utilities", href: `/portfolio/${id}?tab=utilities` },
    { key: "files", label: "Files", href: `/portfolio/${id}?tab=files` },
  ];

  // Occupancy gauge geometry (semicircle).
  const gaugeAngle = Math.PI * (occPct / 100);
  const cx = 100, cy = 100, r = 80;
  const endX = cx - r * Math.cos(gaugeAngle);
  const endY = cy - r * Math.sin(gaugeAngle);

  return (
    <div>
      <TrackView id={property.id} name={property.name} sub={`${property.address}, ${property.city}`} />
      <div className="mb-3 text-sm text-gray-400">
        <Link href="/portfolio" className="text-brand-600 hover:underline">Portfolio</Link> / <span className="text-gray-700">{property.name}</span>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/portfolio" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-2xl font-bold text-gray-900">No.{shortNo(property.id)}</h1>
        </div>
        <div className="flex gap-2">
          <AddUnitButton propertyId={property.id} />
          <Link href={`/renters?property=${property.id}`} className="btn-secondary">Actions ▾</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
              {property.unitType === "SINGLE" ? "Single unit" : "Multi unit"}
            </div>
            <div className="h-40 w-full bg-brand-50">
              {property.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={property.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : <div className="flex h-full items-center justify-center">{Icons.building({ className: "h-10 w-10 text-brand-300" })}</div>}
            </div>
            <div className="p-4">
              <p className="font-semibold text-gray-900">{property.name}</p>
              <p className="text-sm text-gray-500">{property.address}, {property.city}, {property.state} {property.zip}</p>
            </div>
          </div>

          <SidebarCard title="Details">
            <div className="grid grid-cols-2 gap-2">
              <Field label="Build" value={property.yearBuilt ? String(property.yearBuilt) : "—"} />
              <Field label="MLS" value={property.mls ?? "—"} />
            </div>
          </SidebarCard>

          <SidebarCard title="Banking">
            <p className="py-3 text-center text-sm text-gray-400">No bank account assigned.</p>
          </SidebarCard>

          <SidebarCard title="Tenants">
            {tenants.length === 0 ? (
              <p className="py-3 text-center text-sm text-gray-400">No tenants have moved in.</p>
            ) : (
              <ul className="space-y-2">
                {tenants.map((t) => (
                  <li key={t.id}><Link href={`/renters/${t.id}`} className="text-sm text-brand-700 hover:underline">{t.name}</Link></li>
                ))}
              </ul>
            )}
          </SidebarCard>
        </aside>

        {/* Main */}
        <div>
          <div className="mb-6 flex gap-1 border-b border-gray-200">
            {tabs.map((t) => (
              <Link key={t.key} href={t.href} className={cn("-mb-px border-b-2 px-4 py-2.5 text-sm font-medium", t.key === tab ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-gray-800")}>{t.label}</Link>
            ))}
          </div>

          {tab === "summary" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
                <div>
                  <p className="font-semibold text-gray-900">Do you have the right insurance?</p>
                  <p className="text-sm text-gray-600">Protect your rental property from disasters, liability, theft, and more.</p>
                </div>
                <span className="btn-secondary cursor-default opacity-70">Learn more</span>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="card p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="font-semibold text-gray-900">Accounting</h2>
                    <Link href={`/revenues?property=${property.id}`} className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
                  </div>
                  {invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-400">
                      {Icons.reports({ className: "h-8 w-8" })}
                      <p className="mt-2 font-medium text-gray-500">No accounting activity</p>
                      <p className="text-xs">There are no rent invoices yet.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {invoices.slice(0, 5).map((inv) => (
                        <li key={inv.id} className="flex items-center justify-between py-2.5 text-sm">
                          <span className="text-gray-600">{inv.memo ?? inv.type} · {formatDate(inv.dueDate)}</span>
                          <span className="flex items-center gap-2"><span className="font-medium text-gray-900">{formatCurrency(inv.amount)}</span><Badge status={inv.status} /></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="card p-5">
                  <h2 className="mb-3 font-semibold text-gray-900">Occupancy rate</h2>
                  <div className="flex justify-center">
                    <svg viewBox="0 0 200 120" className="w-56">
                      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#e5e7eb" strokeWidth="16" strokeLinecap="round" />
                      {occPct > 0 && (
                        <path d={`M20 100 A80 80 0 0 1 ${endX.toFixed(1)} ${endY.toFixed(1)}`} fill="none" stroke="#229176" strokeWidth="16" strokeLinecap="round" />
                      )}
                      <text x="100" y="92" textAnchor="middle" className="fill-gray-900" style={{ fontSize: 28, fontWeight: 700 }}>{occPct}%</text>
                      <text x="100" y="110" textAnchor="middle" className="fill-gray-400" style={{ fontSize: 11 }}>Occupancy rate</text>
                    </svg>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center">
                    <div><p className="text-xs text-gray-400">Units</p><p className="text-lg font-bold text-gray-900">{property.units.length}</p></div>
                    <div><p className="text-xs text-gray-400">Occupied</p><p className="text-lg font-bold text-green-600">{occupied}</p></div>
                    <div><p className="text-xs text-gray-400">Vacant</p><p className="text-lg font-bold text-amber-600">{vacant}</p></div>
                  </div>
                </div>
              </div>

              {/* Units list */}
              <div className="card overflow-hidden">
                <div className="border-b border-gray-100 px-5 py-3 font-semibold text-gray-900">Units</div>
                <div className="divide-y divide-gray-100">
                  {property.units.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-5 py-3">
                      <div>
                        <div className="flex items-center gap-2"><span className="font-medium text-gray-900">{u.label}</span><Badge status={u.status} /></div>
                        <p className="text-xs text-gray-500">{u.beds} bd · {u.baths} ba{u.sqft ? ` · ${u.sqft} sqft` : ""}{u.leases[0] ? ` · ${u.leases[0].tenant.name}` : ""}</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(u.rent)}/mo</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "utilities" && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold text-gray-900">Utilities</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {[
                  { k: "Parking", v: property.parking },
                  { k: "Laundry", v: property.laundry },
                  { k: "Air conditioning", v: property.airConditioning },
                ].map((x) => (
                  <div key={x.k} className="rounded-lg border border-gray-100 p-4">
                    <p className="text-xs text-gray-400">{x.k}</p>
                    <p className="mt-1 font-medium text-gray-900">{x.v ?? "—"}</p>
                  </div>
                ))}
              </div>
              {(property.amenities.length > 0 || property.features.length > 0) && (
                <div className="mt-6 space-y-4">
                  {property.features.length > 0 && <TagRow title="Features" tags={property.features} />}
                  {property.amenities.length > 0 && <TagRow title="Amenities" tags={property.amenities} />}
                </div>
              )}
            </div>
          )}

          {tab === "files" && (
            <div className="card p-10 text-center text-gray-400">
              {Icons.documents({ className: "mx-auto h-10 w-10" })}
              <p className="mt-2 font-medium text-gray-500">No files yet</p>
              <p className="text-sm">Upload documents for this property from the Documents section.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-gray-100 p-2"><p className="text-xs text-gray-400">{label}</p><p className="text-sm font-medium text-gray-900">{value}</p></div>;
}
function TagRow({ title, tags }: { title: string; tags: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700">{title}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((t) => <span key={t} className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600">{t}</span>)}
      </div>
    </div>
  );
}
