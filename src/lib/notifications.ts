import "server-only";
import { db } from "./db";
import { formatCurrency, formatDate, daysUntil } from "./utils";
import type { Notification } from "@/components/NotificationsBell";

/** Build the landlord's live notification list from current data. */
export async function getLandlordNotifications(landlordId: string): Promise<Notification[]> {
  const owned = { unit: { property: { landlordId } } };
  const notifications: Notification[] = [];

  const prefs = await db.user.findUnique({
    where: { id: landlordId },
    select: { notifyOverdue: true, notifyApplications: true, notifyMaintenance: true, notifyInspections: true },
  });

  const [overdue, newApps, upcomingInspections, openRequests, expiringLeases] = await Promise.all([
    db.invoice.findMany({ where: { status: "OVERDUE", lease: owned }, include: { lease: { include: { tenant: true } } }, orderBy: { dueDate: "asc" }, take: 5 }),
    db.application.findMany({ where: { status: "NEW" }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.inspection.findMany({ where: { status: "SCHEDULED", property: { landlordId } }, include: { property: true }, orderBy: { scheduledFor: "asc" }, take: 5 }),
    db.maintenanceRequest.findMany({ where: { ...owned, status: { not: "RESOLVED" } }, include: { unit: true }, orderBy: { createdAt: "desc" }, take: 5 }),
    db.lease.findMany({ where: { status: "ACTIVE", unit: { property: { landlordId } } }, include: { tenant: true, unit: true } }),
  ]);

  if (prefs?.notifyOverdue !== false)
    for (const inv of overdue) {
      notifications.push({ kind: "overdue", text: `${inv.lease.tenant.name} has overdue rent of ${formatCurrency(inv.amount)}`, href: "/revenues?tab=overdue" });
    }
  if (prefs?.notifyApplications !== false)
    for (const a of newApps) {
      notifications.push({ kind: "application", text: `New application from ${a.name}`, href: "/listings?tab=applications" });
    }
  if (prefs?.notifyInspections !== false)
    for (const i of upcomingInspections) {
      const d = daysUntil(i.scheduledFor);
      if (d >= 0 && d <= 14) notifications.push({ kind: "inspection", text: `Inspection at ${i.property.name} on ${formatDate(i.scheduledFor)}`, href: "/inspections" });
    }
  if (prefs?.notifyMaintenance !== false)
    for (const r of openRequests) {
      notifications.push({ kind: "maintenance", text: `Maintenance: ${r.title} (${r.unit.label})`, href: "/maintenance" });
    }
  for (const l of expiringLeases) {
    const d = daysUntil(l.endDate);
    if (d >= 0 && d <= 60) notifications.push({ kind: "lease", text: `${l.tenant.name}'s lease (${l.unit.label}) expires in ${d} days`, href: "/renters" });
  }

  return notifications;
}
