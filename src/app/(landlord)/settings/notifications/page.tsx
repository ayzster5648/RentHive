import { requireRole } from "@/lib/auth";
import { SettingsNav } from "../SettingsNav";
import { updateNotifications } from "../actions";

type Row = { key: string; label: string; channels: ("email" | "feed")[]; freq?: string[] };
type Section = { title: string; desc: string; rows: Row[] };

const SECTIONS: Section[] = [
  { title: "Security", desc: "Notification about all login activity.", rows: [{ key: "security", label: "", channels: ["email", "feed"] }] },
  { title: "Subscription", desc: "Notification about upcoming subscription renewal.", rows: [{ key: "subscription", label: "", channels: ["email"] }] },
  { title: "New Leads", desc: "Notification about new leads.", rows: [{ key: "newLeads", label: "", channels: ["email", "feed"], freq: ["Instant", "Hourly", "Daily"] }] },
  { title: "Communication", desc: "Notification about new messages.", rows: [{ key: "communication", label: "", channels: ["email", "feed"] }] },
  { title: "Rental Application", desc: "Notifications about new applications submitted by tenants.", rows: [
    { key: "appNotSubmitted", label: "Notify when tenants did not submit applications", channels: ["email", "feed"] },
    { key: "appPaidFees", label: "Notify when tenants paid application fees", channels: ["email", "feed"] },
  ] },
  { title: "Online Payments", desc: "Notification about online payments made.", rows: [
    { key: "payInitiated", label: "Notify when online payment is initiated", channels: ["email", "feed"] },
    { key: "payCleared", label: "Notify when online payment is successfully cleared", channels: ["email", "feed"] },
    { key: "payFailed", label: "Notify when online payment is failed", channels: ["email", "feed"] },
  ] },
  { title: "Tasks Assigned", desc: "Notifications about assigned notes/tasks.", rows: [{ key: "tasks", label: "", channels: ["email", "feed"] }] },
  { title: "Connection Updates", desc: "Notifications about approved or declined connections.", rows: [{ key: "connections", label: "", channels: ["email", "feed"] }] },
  { title: "Properties", desc: "Notifications about rental reports and property insurance expiration.", rows: [
    { key: "rentalReport", label: "Notify when rental report is ready", channels: ["email", "feed"] },
    { key: "propInsuranceExpired", label: "Notify when property insurance expired", channels: ["email", "feed"] },
  ] },
  { title: "Listings", desc: "Notifications about listings declined by listing services, new questions and tour requests.", rows: [
    { key: "listingQuestions", label: "Notify about new questions and tour requests from potential tenants.", channels: ["email", "feed"] },
    { key: "listingDeclined", label: "Notify about your listings declined by listing services", channels: ["email", "feed"] },
  ] },
  { title: "Utility setups", desc: "Notification when tenant activated utilities for the lease.", rows: [{ key: "utilities", label: "", channels: ["email", "feed"] }] },
  { title: "Move in/out Inspection", desc: "Notifications when inspections submitted, completed and/or expired.", rows: [
    { key: "inspectionExpired", label: "Notify when inspection invitation is expired", channels: ["email", "feed"] },
    { key: "inspectionCompleted", label: "Notify when tenant completed the inspection report", channels: ["email", "feed"] },
  ] },
  { title: "State-specific forms", desc: "Notification when state-specific forms are purchased and ready to use.", rows: [{ key: "stateForms", label: "", channels: ["email", "feed"] }] },
  { title: "Screening Reports & Income Verification", desc: "Notifications about screening reports updates.", rows: [
    { key: "screenSent", label: "Notify when report and/or verification request is sent to applicant", channels: ["email", "feed"] },
    { key: "screenCanceled", label: "Notify when report and/or verification request is canceled", channels: ["email", "feed"] },
    { key: "screenReady", label: "Notify when report/verification is ready", channels: ["email", "feed"] },
  ] },
  { title: "Invoices", desc: "Notification about property and general invoices.", rows: [
    { key: "invoicePosted", label: "Notify when invoice is posted", channels: ["email", "feed"] },
    { key: "invoiceDue", label: "Notify when rent invoice is due", channels: ["email", "feed"] },
    { key: "invoiceOverdue", label: "Notify when rent invoice is overdue", channels: ["email", "feed"] },
  ] },
  { title: "Lease", desc: "Notifications about lease updates, notices, and insurance.", rows: [
    { key: "leaseExpired", label: "Notify when lease is expired", channels: ["email", "feed"], freq: ["Day of expiration", "1 week before", "1 month before"] },
    { key: "rentersInsProvided", label: "Notify when renters insurance is provided", channels: ["email", "feed"] },
    { key: "rentersInsExpired", label: "Notify when renters insurance expired", channels: ["email", "feed"] },
    { key: "leaseSigned", label: "Notify when lease/notice/agreement is signed", channels: ["email", "feed"] },
  ] },
  { title: "Maintenance Requests", desc: "Notifications about request updates.", rows: [
    { key: "maintNew", label: "Notify about new request", channels: ["email", "feed"] },
    { key: "maintStatus", label: "Notify about status changes", channels: ["email", "feed"] },
    { key: "maintMessage", label: "Notify about request message", channels: ["email", "feed"] },
    { key: "maintResolved", label: "Notify about request resolved", channels: ["email", "feed"] },
  ] },
];

export default async function NotificationsSettingsPage() {
  const user = await requireRole("LANDLORD");
  let prefs: Record<string, { email?: boolean; feed?: boolean }> = {};
  try { prefs = user.notificationPrefs ? JSON.parse(user.notificationPrefs) : {}; } catch { prefs = {}; }
  const on = (key: string, ch: "email" | "feed") => prefs[key]?.[ch] ?? true; // default on

  const keysMeta = SECTIONS.flatMap((s) => s.rows).map((r) => `${r.key}:${r.channels.join("|")}`).join(",");

  return (
    <div className="max-w-5xl">
      <SettingsNav active="notifications" />
      <form action={updateNotifications} className="mt-6 card p-6">
        <input type="hidden" name="__keys" value={keysMeta} />
        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          <div className="flex gap-10 pr-1 text-sm font-medium text-gray-500"><span>Email</span><span>Feed</span></div>
        </div>

        <div className="divide-y divide-gray-100">
          {SECTIONS.map((s) => (
            <div key={s.title} className="py-5">
              <p className="font-semibold text-gray-900">{s.title}</p>
              <p className="text-sm text-gray-500">{s.desc}</p>
              {s.rows.map((r) => (
                <div key={r.key} className="mt-3 flex items-center justify-between gap-4">
                  <div className="flex-1">
                    {r.label && <p className="text-sm text-gray-700">{r.label}</p>}
                    {r.freq && (
                      <select name={`${r.key}__freq`} defaultValue={r.freq[0]} className="input mt-1 max-w-xs">
                        {r.freq.map((f) => <option key={f}>{f}</option>)}
                      </select>
                    )}
                  </div>
                  <div className="flex items-center gap-10 pr-1">
                    <span className="w-10 text-center">{r.channels.includes("email") ? <input type="checkbox" name={`${r.key}__email`} defaultChecked={on(r.key, "email")} className="h-5 w-5 accent-brand-600" /> : null}</span>
                    <span className="w-10 text-center">{r.channels.includes("feed") ? <input type="checkbox" name={`${r.key}__feed`} defaultChecked={on(r.key, "feed")} className="h-5 w-5 accent-brand-600" /> : null}</span>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-500"><strong>Tips and Offers</strong> — text messages with promos and feature updates.</p>
          <button type="submit" className="btn-primary">Save preferences</button>
        </div>
      </form>
    </div>
  );
}
