import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/utils";
import { PageHeader, StatCard, Badge, Avatar, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { Icons } from "@/components/icons";
import { StatusControl } from "./StatusControl";
import { AddRequestButton, AssignProControl, AddRecurringButton } from "./MaintenanceButtons";
import { KanbanBoard } from "./KanbanBoard";
import { ProMenu } from "./ProMenu";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; property?: string }>;
}) {
  const { tab = "requests", property } = await searchParams;
  const user = await requireRole("LANDLORD");

  const propFilter = property ? { property: { id: property, landlordId: user.id } } : { property: { landlordId: user.id } };
  const propertyName = property ? (await db.property.findUnique({ where: { id: property } }))?.name : undefined;

  const requests = await db.maintenanceRequest.findMany({
    where: { unit: propFilter },
    include: { tenant: true, assignee: true, unit: { include: { property: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  const pros = await db.servicePro.findMany({ orderBy: [{ archived: "asc" }, { name: "asc" }] });
  const units = await db.unit.findMany({ where: { property: { landlordId: user.id } }, include: { property: true }, orderBy: { label: "asc" } });

  const unitOptions = units.map((u) => ({ id: u.id, label: u.label, propertyName: u.property.name }));
  const proOptions = pros.filter((p) => !p.archived).map((p) => ({ id: p.id, name: p.name }));
  const qp = (t: string) => `/maintenance?tab=${t}${property ? `&property=${property}` : ""}`;

  const tabs = [
    { key: "requests", label: "Requests", href: property ? qp("requests").replace("?tab=requests", `?property=${property}`) : "/maintenance", badge: String(requests.filter((r) => r.status !== "RESOLVED").length) },
    { key: "board", label: "Requests Board", href: qp("board") },
    { key: "recurring", label: "Recurring", href: qp("recurring") },
    { key: "pros", label: "Service Pros", href: qp("pros"), badge: String(pros.length) },
  ];

  const action =
    tab === "pros" ? <Link href="/maintenance/pros/new" className="btn-primary">{Icons.plus({ className: "h-4 w-4" })}Add service pro</Link>
    : tab === "recurring" ? <AddRecurringButton units={unitOptions} pros={proOptions} />
    : <AddRequestButton units={unitOptions} pros={proOptions} />;

  return (
    <div>
      <PageHeader title={propertyName ? `Maintenance · ${propertyName}` : "Maintenance"} action={action} />
      <Tabs tabs={tabs} active={tab} />

      {tab === "requests" && <RequestsTab requests={requests} pros={proOptions} />}
      {tab === "board" && (
        requests.length === 0 ? <EmptyState title="No requests to organize" hint="Add a request and it'll show on the board." /> :
        <KanbanBoard
          pros={proOptions}
          initial={requests.map((r) => ({ id: r.id, title: r.title, category: r.category, priority: r.priority, status: r.status, unitLabel: r.unit.label, propertyName: r.unit.property.name, assigneeId: r.assigneeId }))}
        />
      )}
      {tab === "recurring" && <RecurringTab requests={requests.filter((r) => r.recurring)} />}
      {tab === "pros" && <ProsTab pros={pros} requests={requests} />}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function RequestsTab({ requests, pros }: { requests: any[]; pros: { id: string; name: string }[] }) {
  const open = requests.filter((r) => r.status === "OPEN").length;
  const inProgress = requests.filter((r) => r.status === "IN_PROGRESS").length;
  const resolved = requests.filter((r) => r.status === "RESOLVED").length;
  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Open" value={String(open)} accent="amber" />
        <StatCard label="In progress" value={String(inProgress)} accent="brand" />
        <StatCard label="Resolved" value={String(resolved)} accent="green" />
      </div>
      {requests.length === 0 ? (
        <EmptyState title="No results found" hint="Please modify your search criteria and try again." />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex items-start gap-3">
                <Avatar name={r.tenant.name} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <Badge status={r.priority} />
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">{r.category}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">{r.description}</p>
                  <p className="mt-1 text-xs text-gray-400">{r.unit.property.name} · {r.unit.label} · {formatDate(r.createdAt)}{r.assignee ? ` · ${r.assignee.name}` : ""}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AssignProControl id={r.id} assigneeId={r.assigneeId} pros={pros} />
                <StatusControl id={r.id} status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecurringTab({ requests }: { requests: any[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-[100px_80px_1fr_1.4fr_140px] gap-4 border-b border-gray-100 px-5 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">
        <span>Status</span><span>ID</span><span>Category</span><span>Property &amp; unit</span><span>Duration</span>
      </div>
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
          {Icons.reports({ className: "h-8 w-8" })}
          <p className="mt-2 font-medium text-gray-500">No recurring requests</p>
          <p className="text-sm">There are no recurring requests on this page.</p>
        </div>
      ) : requests.map((r, i) => (
        <div key={r.id} className="grid grid-cols-[100px_80px_1fr_1.4fr_140px] gap-4 px-5 py-3 text-sm hover:bg-gray-50">
          <Badge status={r.status} />
          <span className="text-gray-400">#{String(1000 + i)}</span>
          <span className="text-gray-700">{r.category}</span>
          <span className="text-gray-600">{r.unit.property.name}, {r.unit.label}</span>
          <span className="text-gray-500">Monthly</span>
        </div>
      ))}
    </div>
  );
}

function ProsTab({ pros, requests }: { pros: any[]; requests: any[] }) {
  if (pros.length === 0) return <EmptyState title="No service pros yet" hint="Click “Add service pro” to add a vendor you work with." />;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {pros.map((p) => {
        const assigned = requests.filter((r) => r.assigneeId === p.id).length;
        return (
          <div key={p.id} className="card p-5 text-center">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-gray-300">{Icons.renters({ className: "h-4 w-4" })}</span>
              <div className="flex items-center gap-1 text-gray-300">
                {Icons.chat({ className: "h-4 w-4" })}
                <ProMenu id={p.id} archived={p.archived} />
              </div>
            </div>
            <Link href={`/maintenance/pros/${p.id}`}>
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-400 text-xl font-semibold text-white">
                {p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
              </div>
              <p className="font-semibold text-gray-900">{p.name}{p.archived && <span className="ml-1 text-xs text-gray-400">(archived)</span>}</p>
            </Link>
            {p.phone && <p className="text-xs text-brand-600 underline">{p.phone}</p>}
            <p className="mt-2 text-sm text-gray-500">{p.subcategory ?? p.category}</p>
            <p className="mt-1 text-xs text-gray-400">{assigned} assigned job{assigned !== 1 ? "s" : ""}</p>
            <Link href={`/maintenance/pros/${p.id}`} className="mt-3 block border-t border-gray-100 pt-3 text-sm font-medium text-brand-600 hover:underline">View profile</Link>
          </div>
        );
      })}
    </div>
  );
}
