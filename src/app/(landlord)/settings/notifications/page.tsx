import { requireRole } from "@/lib/auth";
import { SettingsNav } from "../SettingsNav";
import { updateNotifications } from "../actions";

const prefs = [
  { key: "notifyOverdue", label: "Overdue rent", desc: "Alert me when a tenant's rent becomes overdue." },
  { key: "notifyApplications", label: "New applications", desc: "Alert me when someone applies to a listing." },
  { key: "notifyMaintenance", label: "Maintenance requests", desc: "Alert me about new and open maintenance." },
  { key: "notifyInspections", label: "Upcoming inspections", desc: "Remind me about scheduled inspections." },
] as const;

export default async function NotificationsSettingsPage() {
  const user = await requireRole("LANDLORD");

  return (
    <div className="max-w-2xl">
      <SettingsNav active="notifications" />
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900">Notification preferences</h2>
        <p className="mb-5 text-sm text-gray-500">Choose what shows in your notifications bell.</p>
        <form action={updateNotifications} className="space-y-4">
          {prefs.map((p) => (
            <label key={p.key} className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 p-4">
              <div>
                <p className="font-medium text-gray-900">{p.label}</p>
                <p className="text-sm text-gray-500">{p.desc}</p>
              </div>
              <input
                type="checkbox"
                name={p.key}
                defaultChecked={user[p.key] as boolean}
                className="mt-1 h-5 w-5 accent-brand-600"
              />
            </label>
          ))}
          <button type="submit" className="btn-primary">Save preferences</button>
        </form>
      </div>
    </div>
  );
}
