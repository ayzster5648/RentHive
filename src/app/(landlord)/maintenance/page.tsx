import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatDate, cn } from "@/lib/utils";
import { PageHeader, StatCard, Badge, Avatar, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { StatusControl } from "./StatusControl";
import { AddRequestButton, AddServiceProButton, AssignProControl } from "./MaintenanceButtons";

export default async function MaintenancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "requests" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const requests = await db.maintenanceRequest.findMany({
    where: { unit: { property: { landlordId: user.id } } },
    include: { tenant: true, assignee: true, unit: { include: { property: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  const pros = await db.servicePro.findMany({ orderBy: { name: "asc" } });
  const units = await db.unit.findMany({ where: { property: { landlordId: user.id } }, include: { property: true }, orderBy: { label: "asc" } });

  const unitOptions = units.map((u) => ({ id: u.id, label: u.label, propertyName: u.property.name }));
  const proOptions = pros.map((p) => ({ id: p.id, name: p.name }));

  const tabs = [
    { key: "requests", label: "Requests", href: "/maintenance", badge: String(requests.filter((r) => r.status !== "RESOLVED").length) },
    { key: "board", label: "Requests Board", href: "/maintenance?tab=board" },
    { key: "recurring", label: "Recurring", href: "/maintenance?tab=recurring" },
    { key: "pros", label: "Service Pros", href: "/maintenance?tab=pros", badge: String(pros.length) },
  ];

  const action = tab === "pros" ? <AddServiceProButton /> : <AddRequestButton units={unitOptions} pros={proOptions} />;

  return (
    <div>
      <PageHeader title="Maintenance" action={action} />
      <Tabs tabs={tabs} active={tab} />

      {tab === "requests" && <RequestsTab requests={requests} pros={proOptions} />}
      {tab === "board" && <BoardTab requests={requests} />}
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
        <EmptyState title="No maintenance requests" hint="Tenant- and landlord-submitted requests show here." />
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

function BoardTab({ requests }: { requests: any[] }) {
  const columns = [
    { key: "OPEN", label: "Open", color: "border-t-blue-400" },
    { key: "IN_PROGRESS", label: "In Progress", color: "border-t-amber-400" },
    { key: "RESOLVED", label: "Resolved", color: "border-t-green-400" },
  ];
  return (
    <div>
      <p className="mb-4 text-sm text-gray-500">Visualize all maintenance work in one place, organized by status.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const items = requests.filter((r) => r.status === col.key);
          return (
            <div key={col.key} className={cn("rounded-xl border border-gray-200 border-t-4 bg-gray-50 p-3", col.color)}>
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500">{items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map((r) => (
                  <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{r.title}</p>
                      <Badge status={r.priority} />
                    </div>
                    <p className="mt-1 text-xs text-gray-400">{r.unit.label} · {r.category}</p>
                    {r.assignee && <p className="mt-1 text-xs text-brand-600">{r.assignee.name}</p>}
                  </div>
                ))}
                {items.length === 0 && <p className="px-1 py-4 text-center text-xs text-gray-400">Nothing here</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecurringTab({ requests }: { requests: any[] }) {
  if (requests.length === 0) return <EmptyState title="No recurring tasks" hint="Mark a request as recurring to schedule repeat maintenance." />;
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="card flex items-center justify-between p-4">
          <div>
            <p className="font-medium text-gray-900">{r.title}</p>
            <p className="text-xs text-gray-400">{r.unit.property.name} · {r.unit.label} · {r.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Recurring</span>
            <Badge status={r.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProsTab({ pros, requests }: { pros: any[]; requests: any[] }) {
  if (pros.length === 0) return <EmptyState title="No service pros yet" hint="Add vendors you work with to assign them to requests." />;
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {pros.map((p) => {
        const assigned = requests.filter((r) => r.assigneeId === p.id).length;
        return (
          <div key={p.id} className="card p-5 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
              {p.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
            </div>
            <p className="font-semibold text-gray-900">{p.name}</p>
            {p.phone && <p className="text-xs text-brand-600">{p.phone}</p>}
            <p className="mt-2 text-xs text-gray-500">{p.category}</p>
            {p.company && <p className="text-xs text-gray-400">{p.company}</p>}
            <p className="mt-2 rounded bg-gray-50 px-2 py-1 text-xs text-gray-500">{assigned} assigned job{assigned !== 1 ? "s" : ""}</p>
          </div>
        );
      })}
    </div>
  );
}
