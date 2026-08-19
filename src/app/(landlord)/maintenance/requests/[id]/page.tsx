import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { StatusPill } from "../../pills";
import { ChangeStatusButton, ActionsMenu, AssigneeControl } from "./RequestControls";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("LANDLORD");

  const req = await db.maintenanceRequest.findFirst({
    where: { id, unit: { property: { landlordId: user.id } } },
    include: {
      assignee: true,
      unit: { include: { property: true, leases: { where: { status: "ACTIVE" }, include: { tenant: true } } } },
    },
  });
  if (!req) notFound();

  const pros = (await db.servicePro.findMany({ where: { archived: false }, orderBy: { name: "asc" } })).map((p) => ({ id: p.id, name: p.name }));
  const tenants = req.unit.leases.map((l) => l.tenant);
  const refNumber = req.refNumber ?? 100000 + (req.createdAt.getTime() % 900000);
  const propLabel = `${req.unit.property.name}${req.unit.label ? `, ${req.unit.label}` : ""}`;
  const categoryPath = req.category.split(/[\s/]+\/?\s*/).filter(Boolean).join(" / ");

  const Section = ({ children }: { children: React.ReactNode }) => (
    <div className="card mt-4 p-6">{children}</div>
  );
  const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-400">
        <Link href="/dashboard" className="text-brand-600 hover:underline">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href="/maintenance" className="text-brand-600 hover:underline">Requests</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-600">#{refNumber}</span>
      </nav>

      {/* Header bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/maintenance" className="text-gray-400 hover:text-gray-600">←</Link>
          <h1 className="text-xl font-semibold text-gray-900">Maintenance request</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-400" title="History">🕒</span>
          <ChangeStatusButton id={req.id} status={req.status} />
          <button className="btn-secondary" disabled>Chat 💬</button>
          <ActionsMenu id={req.id} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div>
          <div className="card p-6">
            <div className="flex items-center gap-2 text-gray-400">🏷 <span className="text-2xl font-bold text-gray-900">No. {refNumber}</span></div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-gray-100 px-3 py-1 text-sm text-gray-600">💧 {categoryPath}</div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900">{categoryPath}</h2>
              <StatusPill status={req.status} />
            </div>

            <div className="mt-6 flex items-center gap-2 text-lg font-semibold text-gray-800">🏠 Property</div>
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">🏠 {propLabel}</div>

            <h3 className="mt-6 text-base font-semibold text-gray-800">Description</h3>
            <p className="mt-2 whitespace-pre-line text-gray-600">{req.description || "—"}</p>
          </div>

          {/* Media */}
          <Section>
            <details>
              <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-gray-800">
                <span>🖼 Media</span><span className="text-gray-400">▾</span>
              </summary>
              <p className="mt-3 text-sm text-gray-400">Photo & video attachments appear here once the file-storage integration is enabled.</p>
            </details>
          </Section>

          {/* Assignee information */}
          <Section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">👤 Assignee information <span className="text-sm font-normal text-gray-400">(Details)</span></h3>
              <span className="text-sm text-gray-400">{req.assignee ? "Re-Assign" : "Add assignee"}</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Row label="Type" value="One time" />
              <Row label="Started work" value="—" />
              <Row label="Priority" value={req.priority === "MEDIUM" ? "Normal" : req.priority.charAt(0) + req.priority.slice(1).toLowerCase()} />
              <Row label="Ended work" value="—" />
            </div>
            <div className="mt-4">
              <p className="mb-1 text-sm text-gray-500">Assigned to</p>
              <AssigneeControl id={req.id} assigneeId={req.assigneeId} pros={pros} />
            </div>
          </Section>

          {/* Tenant information */}
          <Section>
            <h3 className="text-base font-semibold text-gray-800">📊 Tenant information <span className="text-sm font-normal text-gray-400">(Details)</span></h3>
            <div className="mt-4 grid grid-cols-1 gap-x-10 gap-y-1 sm:grid-cols-2">
              <Row label="Authorization" value="—" />
              <Row label="Availability time 1" value="—" />
              <Row label="Alarm code" value="—" />
              <Row label="Availability time 2" value="—" />
              <Row label="Pets" value="—" />
              <Row label="Availability time 3" value={req.availability || "—"} />
            </div>
            {tenants.length > 0 ? (
              <div className="mt-4">
                <p className="mb-2 text-sm text-gray-500">Tenants</p>
                <div className="flex flex-wrap gap-2">
                  {tenants.map((t) => (
                    <span key={t.id} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-400 text-xs font-semibold text-white">{t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}</span>
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 border-t border-yellow-200 pt-3 text-sm text-gray-500">
                <span className="text-yellow-500">💡</span> There are no tenants with an active lease for the selected property.
              </div>
            )}
          </Section>

          {/* Materials */}
          <Section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">🧰 Materials <span className="text-sm font-normal text-gray-400">(0 records)</span></h3>
              <span className="text-sm font-medium text-brand-600">Add material ▾</span>
            </div>
          </Section>

          {/* Transactions */}
          <Section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">💲 Transactions <span className="text-sm font-normal text-gray-400">(0 records)</span></h3>
              <div className="flex items-center gap-4 text-sm font-medium">
                <Link href="/expenses" className="text-gray-500 hover:text-gray-700">— Money out</Link>
                <Link href="/revenues/new" className="text-brand-600">+ Money in ▾</Link>
              </div>
            </div>
          </Section>

          {/* Attachments */}
          <Section>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-800">📎 Attachments <span className="text-sm font-normal text-gray-400">(0 records)</span></h3>
              <span className="text-gray-400">▾</span>
            </div>
          </Section>

          <p className="mt-4 text-right text-sm text-gray-400">Created on {formatDate(req.createdAt)}</p>
        </div>

        {/* Sidebar: Find a Pro */}
        <aside>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50/60 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-800">Need help fixing it?</p>
              <span className="text-sm font-medium text-brand-600">Find a Pro</span>
            </div>
            <p className="mt-3 text-sm text-gray-600">Find trusted local pros, compare options, and hire with confidence.</p>
            <p className="mt-3 flex items-center gap-1 text-sm text-gray-500">📍 Serves {req.unit.property.city ?? "your area"}</p>
            <p className="mt-2 text-yellow-500">★★★★★ <span className="text-xs text-gray-500">Trusted by property owners</span></p>
          </div>
        </aside>
      </div>
    </div>
  );
}
