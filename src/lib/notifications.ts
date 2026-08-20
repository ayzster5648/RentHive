import "server-only";
import { db } from "./db";
import { formatCurrency, formatDate, daysUntil } from "./utils";
import type { Notification } from "@/components/NotificationsBell";

export type NotifyPrefs = Record<string, { email?: boolean; feed?: boolean }>;

/** Parse the JSON notification matrix saved from Settings → Notifications. */
export function parseNotifyPrefs(json: string | null | undefined): NotifyPrefs {
  if (!json) return {};
  try { return JSON.parse(json) as NotifyPrefs; } catch { return {}; }
}

/** Which matrix key drives each in-app feed notification kind. */
const FEED_KEY: Record<Notification["kind"], string> = {
  overdue: "invoiceOverdue",
  application: "newLeads",
  inspection: "inspectionExpired",
  maintenance: "maintNew",
  lease: "leaseExpired",
};

/**
 * Is a given channel enabled for a notification type? Honors the saved matrix;
 * when a key was never saved it defaults to on so nothing silently disappears.
 */
export function channelEnabled(prefs: NotifyPrefs, key: string, channel: "email" | "feed"): boolean {
  return prefs[key]?.[channel] ?? true;
}

/** Server-side lookup used by actions that dispatch email. */
export async function emailEnabled(landlordId: string, key: string): Promise<boolean> {
  const u = await db.user.findUnique({ where: { id: landlordId }, select: { notificationPrefs: true } });
  return channelEnabled(parseNotifyPrefs(u?.notificationPrefs), key, "email");
}

/** Build the landlord's live notification list, honoring the Feed toggles. */
export async function getLandlordNotifications(landlordId: string): Promise<Notification[]> {
  const owned = { unit: { property: { landlordId } } };
  const notifications: Notification[] = [];

  const user = await db.user.findUnique({
    where: { id: landlordId },
    select: {
      notificationPrefs: true,
      notifyOverdue: true, notifyApplications: true, notifyMaintenance: true, notifyInspections: true,
    },
  });
  const prefs = parseNotifyPrefs(user?.notificationPrefs);

  // Feed toggle for a kind: matrix value if present, else the legacy boolean, else on.
  const feedOn = (kind: Notification["kind"]): boolean => {
    const key = FEED_KEY[kind];
    if (key in prefs) return prefs[key]?.feed ?? true;
    switch (kind) {
      case "overdue": return user?.notifyOverdue !== false;
      case "application": return user?.notifyApplications !== false;
      case "inspection": return user?.notifyInspections !== false;
      case "maintenance": return user?.notifyMaintenance !== false;
      default: return true;
    }
  };

  const [overdue, newApps, upcomingInspections, openRequests, expiringLeases] = await Promise.all([
    feedOn("overdue") ? db.invoice.findMany({ where: { status: "OVERDUE", lease: owned }, include: { lease: { include: { tenant: true } } }, orderBy: { dueDate: "asc" }, take: 5 }) : [],
    feedOn("application") ? db.application.findMany({ where: { status: "NEW" }, orderBy: { createdAt: "desc" }, take: 5 }) : [],
    feedOn("inspection") ? db.inspection.findMany({ where: { status: "SCHEDULED", property: { landlordId } }, include: { property: true }, orderBy: { scheduledFor: "asc" }, take: 5 }) : [],
    feedOn("maintenance") ? db.maintenanceRequest.findMany({ where: { ...owned, status: { notIn: ["RESOLVED", "CANCELLED"] } }, include: { unit: true }, orderBy: { createdAt: "desc" }, take: 5 }) : [],
    feedOn("lease") ? db.lease.findMany({ where: { status: "ACTIVE", unit: { property: { landlordId } } }, include: { tenant: true, unit: true } }) : [],
  ]);

  for (const inv of overdue)
    notifications.push({ kind: "overdue", text: `${inv.lease.tenant.name} has overdue rent of ${formatCurrency(inv.amount)}`, href: "/revenues?tab=overdue" });
  for (const a of newApps)
    notifications.push({ kind: "application", text: `New application from ${a.name}`, href: "/listings?tab=applications" });
  for (const i of upcomingInspections) {
    const d = daysUntil(i.scheduledFor);
    if (d >= 0 && d <= 14) notifications.push({ kind: "inspection", text: `Inspection at ${i.property.name} on ${formatDate(i.scheduledFor)}`, href: "/inspections" });
  }
  for (const r of openRequests)
    notifications.push({ kind: "maintenance", text: `Maintenance: ${r.title} (${r.unit.label})`, href: "/maintenance" });
  for (const l of expiringLeases) {
    const d = daysUntil(l.endDate);
    if (d >= 0 && d <= 60) notifications.push({ kind: "lease", text: `${l.tenant.name}'s lease (${l.unit.label}) expires in ${d} days`, href: "/renters" });
  }

  return notifications;
}
