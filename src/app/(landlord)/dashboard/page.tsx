import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PageHeader, StatCard, Badge, Avatar, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { Icons } from "@/components/icons";
import { TaskItem } from "./TaskItem";
import { AddTaskButton, AddReminderButton } from "./QuickAdd";

const reminderColors: Record<string, string> = {
  LEASE: "bg-red-50 text-red-700",
  RENT: "bg-green-50 text-green-700",
  MAINTENANCE: "bg-amber-50 text-amber-700",
  INSPECTION: "bg-blue-50 text-blue-700",
  CUSTOM: "bg-gray-100 text-gray-700",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "overview" } = await searchParams;
  const user = await requireRole("LANDLORD");

  const properties = await db.property.findMany({ where: { landlordId: user.id }, include: { units: true } });
  const propertyIds = properties.map((p) => p.id);
  const units = properties.flatMap((p) => p.units);
  const occupied = units.filter((u) => u.status === "OCCUPIED").length;
  const occupancyRate = units.length ? Math.round((occupied / units.length) * 100) : 0;

  const tabs = [
    { key: "overview", label: "Overview", href: "/dashboard" },
    { key: "calendar", label: "Calendar", href: "/dashboard?tab=calendar" },
    { key: "tasks", label: "Tasks", href: "/dashboard?tab=tasks" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" />
      <Tabs tabs={tabs} active={tab} />

      {tab === "overview" && <Overview user={user} propertyIds={propertyIds} properties={properties} units={units} occupied={occupied} occupancyRate={occupancyRate} />}
      {tab === "calendar" && <CalendarTab />}
      {tab === "tasks" && <TasksTab />}
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function Overview({ user, propertyIds, properties, units, occupied, occupancyRate }: any) {
  const leases = await db.lease.findMany({
    where: { unit: { propertyId: { in: propertyIds } } },
    include: { invoices: true },
  });
  const allInvoices = leases.flatMap((l) => l.invoices);
  const outstanding = allInvoices.filter((i) => i.status !== "PAID").reduce((s, i) => s + i.amount, 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const collected = (
    await db.payment.findMany({ where: { paidAt: { gte: monthStart }, invoice: { lease: { unit: { propertyId: { in: propertyIds } } } } } })
  ).reduce((s, p) => s + p.amount, 0);
  const expensesThisMonth = (
    await db.expense.findMany({ where: { date: { gte: monthStart }, propertyId: { in: propertyIds } } })
  ).reduce((s, e) => s + e.amount, 0);

  const overdue = await db.invoice.findMany({
    where: { status: "OVERDUE", lease: { unit: { propertyId: { in: propertyIds } } } },
    include: { lease: { include: { tenant: true, unit: true } } },
    orderBy: { dueDate: "asc" },
  });
  const recentRequests = await db.maintenanceRequest.findMany({
    where: { unit: { propertyId: { in: propertyIds } } },
    include: { tenant: true, unit: { include: { property: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const newApplications = await db.application.count({ where: { status: "NEW" } });

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Properties" value={String(properties.length)} sub={`${units.length} units`} />
        <StatCard label="Occupancy" value={`${occupancyRate}%`} sub={`${occupied}/${units.length} occupied`} accent="green" />
        <StatCard label="Collected this month" value={formatCurrency(collected)} sub={`${formatCurrency(expensesThisMonth)} expenses`} accent="green" />
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} sub={newApplications ? `${newApplications} new applicants` : undefined} accent={outstanding > 0 ? "red" : "brand"} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Overdue rent</h2>
            <Link href="/revenues" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          {overdue.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No overdue invoices 🎉</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {overdue.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={inv.lease.tenant.name} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.lease.tenant.name}</p>
                      <p className="text-xs text-gray-400">{inv.lease.unit.label} · due {formatDate(inv.dueDate)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(inv.amount)}</p>
                    <Badge status="OVERDUE" />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent maintenance</h2>
            <Link href="/maintenance" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          {recentRequests.length === 0 ? (
            <EmptyState title="No requests yet" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-400">{r.unit.property.name} · {r.unit.label} · {r.tenant.name}</p>
                  </div>
                  <Badge status={r.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

async function CalendarTab() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const reminders = await db.reminder.findMany({
    where: { date: { gte: new Date(year, month, 1), lt: new Date(year, month + 1, 1) } },
    orderBy: { date: "asc" },
  });

  const remindersByDay = new Map<number, typeof reminders>();
  for (const r of reminders) {
    const d = new Date(r.date).getDate();
    if (!remindersByDay.has(d)) remindersByDay.set(d, []);
    remindersByDay.get(d)!.push(r);
  }

  const firstWeekday = monthStart.getDay();
  const daysInMonth = monthEnd.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">{now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
        <AddReminderButton />
      </div>
      <div className="card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500">
          {weekdays.map((w) => <div key={w} className="py-2">{w}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const isToday = d === now.getDate();
            const dayReminders = d ? remindersByDay.get(d) ?? [] : [];
            return (
              <div key={i} className={cn("min-h-[96px] border-b border-r border-gray-100 p-1.5", i % 7 === 6 && "border-r-0")}>
                {d && (
                  <>
                    <div className={cn("mb-1 flex h-6 w-6 items-center justify-center rounded-full text-sm", isToday ? "bg-brand-600 font-semibold text-white" : "text-gray-600")}>{d}</div>
                    <div className="space-y-1">
                      {dayReminders.map((r) => (
                        <div key={r.id} className={cn("truncate rounded px-1.5 py-0.5 text-[11px]", reminderColors[r.type])} title={r.title}>{r.title}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

async function TasksTab() {
  const tasks = await db.task.findMany({ orderBy: [{ done: "asc" }, { createdAt: "desc" }] });
  const open = tasks.filter((t) => !t.done).length;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Tasks <span className="text-sm font-normal text-gray-400">({open} open)</span></h2>
        <AddTaskButton />
      </div>
      <div className="card p-5">
        {tasks.length === 0 ? (
          <EmptyState title="No tasks" hint="Add a task to stay on top of your to-dos." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {tasks.map((t) => (
              <TaskItem key={t.id} id={t.id} title={t.title} done={t.done} due={t.dueDate ? formatDate(t.dueDate) : undefined} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
