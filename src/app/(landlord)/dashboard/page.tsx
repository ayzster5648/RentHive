import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getSetupState } from "@/lib/setup";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { PageHeader, StatCard, Badge, Avatar, EmptyState } from "@/components/ui";
import { Tabs } from "@/components/Tabs";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { TaskItem } from "./TaskItem";
import { AddTaskButton, AddReminderButton } from "./QuickAdd";
import { SetupChecklist } from "./SetupChecklist";

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
  const setup = await getSetupState(user.id);

  const tabs = [
    { key: "overview", label: "Overview", href: "/dashboard" },
    { key: "calendar", label: "Calendar", href: "/dashboard?tab=calendar" },
    { key: "tasks", label: "Tasks", href: "/dashboard?tab=tasks" },
    // The setup tab disappears once everything is done.
    ...(setup.percent < 100 ? [{ key: "setup", label: "Setup", href: "/dashboard?tab=setup" }] : []),
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user.name.split(" ")[0]}`} />
      <Tabs tabs={tabs} active={tab} />

      {tab === "overview" && <Overview landlordId={user.id} />}
      {tab === "calendar" && <CalendarTab />}
      {tab === "tasks" && <TasksTab />}
      {tab === "setup" && <SetupTab landlordId={user.id} />}
    </div>
  );
}

async function Overview({ landlordId }: { landlordId: string }) {
  const propertyIds = (await db.property.findMany({ where: { landlordId }, select: { id: true } })).map((p) => p.id);
  const ownedLease = { unit: { propertyId: { in: propertyIds } } };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [setup, leases, payments, expenses, overdue, recentRequests, newApplications, reminders] = await Promise.all([
    getSetupState(landlordId),
    db.lease.findMany({ where: ownedLease, select: { status: true, startDate: true } }),
    db.payment.findMany({ where: { paidAt: { gte: monthStart }, invoice: { lease: ownedLease } } }),
    db.expense.findMany({ where: { date: { gte: monthStart }, OR: [{ property: { landlordId } }, { propertyId: null }] } }),
    db.invoice.findMany({ where: { status: "OVERDUE", lease: ownedLease }, include: { lease: { include: { tenant: true, unit: true } } }, orderBy: { dueDate: "asc" }, take: 4 }),
    db.maintenanceRequest.findMany({ where: { unit: { propertyId: { in: propertyIds } } }, include: { tenant: true, unit: true }, orderBy: { createdAt: "desc" }, take: 4 }),
    db.application.count({ where: { status: "NEW" } }),
    db.reminder.findMany({ where: { date: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } }, orderBy: { date: "asc" }, take: 4 }),
  ]);

  const income = payments.reduce((s, p) => s + p.amount, 0);
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0);
  const net = income - expenseTotal;
  const maxBar = Math.max(income, expenseTotal, 1);

  const funnel = {
    active: leases.filter((l) => l.status === "ACTIVE").length,
    future: leases.filter((l) => l.status === "PENDING" && new Date(l.startDate) > now).length,
    drafted: 0,
    ended: leases.filter((l) => l.status === "ENDED").length,
  };

  return (
    <div className="space-y-6">
      {/* Setup banner if incomplete */}
      {setup.percent < 100 && <SetupChecklist setup={setup} compact />}

      {/* Top row: reminders + accounting */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Today</h2>
            <Link href="/dashboard?tab=calendar" className="text-sm font-medium text-brand-600 hover:underline">Calendar</Link>
          </div>
          {reminders.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">No upcoming reminders.</p>
          ) : (
            <ul className="space-y-2">
              {reminders.map((r) => (
                <li key={r.id} className={cn("rounded-lg px-3 py-2 text-sm", reminderColors[r.type])}>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs opacity-70">{formatDate(r.date)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Accounting */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Accounting <span className="text-sm font-normal text-gray-400">· this month</span></h2>
            <Link href="/transactions" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Income</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(income)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Expenses</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(expenseTotal)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Net</p>
              <p className={cn("text-2xl font-bold", net >= 0 ? "text-gray-900" : "text-red-600")}>{formatCurrency(net)}</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500">Income</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-green-500" style={{ width: `${(income / maxBar) * 100}%` }} /></div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500">Expenses</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-red-500" style={{ width: `${(expenseTotal / maxBar) * 100}%` }} /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recently viewed */}
      <RecentlyViewed />

      {/* Leases funnel */}
      <div className="card p-5">
        <h2 className="mb-4 font-semibold text-gray-900">Leases</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Active leases", value: funnel.active, color: "text-green-600", dot: "bg-green-500" },
            { label: "Future", value: funnel.future, color: "text-amber-600", dot: "bg-amber-500" },
            { label: "Drafted", value: funnel.drafted, color: "text-gray-600", dot: "bg-gray-400" },
            { label: "Ended", value: funnel.ended, color: "text-red-600", dot: "bg-red-500" },
          ].map((f) => (
            <div key={f.label} className="rounded-lg border border-gray-100 p-4">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", f.dot)} />
                <span className="text-sm text-gray-500">{f.label}</span>
              </div>
              <p className={cn("mt-1 text-2xl font-bold", f.color)}>{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Overdue + Maintenance + Applicants */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Overdue rent</h2>
            <Link href="/revenues?tab=overdue" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
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

        <div className="space-y-6">
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Maintenance</h2>
              <Link href="/maintenance" className="text-sm font-medium text-brand-600 hover:underline">View all</Link>
            </div>
            {recentRequests.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">No requests.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentRequests.map((r) => (
                  <li key={r.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{r.title}</p>
                      <p className="text-xs text-gray-400">{r.unit.label} · {r.tenant.name}</p>
                    </div>
                    <Badge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link href="/listings?tab=applications" className="card flex items-center justify-between p-5 transition-shadow hover:shadow-md">
            <div>
              <h2 className="font-semibold text-gray-900">Manage applicants</h2>
              <p className="text-sm text-gray-500">{newApplications > 0 ? `${newApplications} new application${newApplications !== 1 ? "s" : ""} to review` : "Review and screen applicants"}</p>
            </div>
            {newApplications > 0 && <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-brand-600 px-2 text-sm font-semibold text-white">{newApplications}</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}

async function SetupTab({ landlordId }: { landlordId: string }) {
  const setup = await getSetupState(landlordId);
  return (
    <div className="max-w-2xl">
      <SetupChecklist setup={setup} />
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
