import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { SettingsNav } from "../SettingsNav";
import { toggleTwoFactor } from "../actions";

export default async function SecuritySettingsPage() {
  const user = await requireRole("LANDLORD");

  const sessions = [
    { location: "Current device", device: "This browser", ip: "—", last: "Just now", current: true },
  ];

  return (
    <div className="max-w-5xl">
      <SettingsNav active="security" />
      <div className="mt-6 card divide-y divide-gray-100 p-6">
        {/* ID Verification */}
        <div className="pb-6">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">ID Verification</h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">In progress</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">Identity verification helps prevent fraud and increase security. This connects to Stripe Identity when the payments integration is enabled.</p>
          <button className="btn-primary mt-3" disabled title="Requires Stripe integration">Continue</button>
        </div>

        {/* Export data */}
        <div className="py-6">
          <h2 className="font-semibold text-gray-900">Export data</h2>
          <p className="mt-1 text-sm text-gray-500">Export your data for backup or other purposes.</p>
          <Link href="/downloads" className="btn-secondary mt-3 inline-flex">Export</Link>
        </div>

        {/* Two-Step Authentication */}
        <div className="py-6">
          <h2 className="font-semibold text-gray-900">Two-Step Authentication</h2>
          <p className="mt-1 text-sm text-gray-500">Keep your account secure with a second authentication step.</p>
          <form action={toggleTwoFactor} className="mt-3">
            <input type="hidden" name="enabled" value={user.twoFactor ? "false" : "true"} />
            <button type="submit" className={user.twoFactor ? "btn-secondary" : "btn-primary"}>
              {user.twoFactor ? "Disable" : "Enable"}
            </button>
            {user.twoFactor && <span className="ml-3 text-sm font-medium text-green-600">Enabled</span>}
          </form>
        </div>

        {/* Login sessions */}
        <div className="pt-6">
          <h2 className="font-semibold text-gray-900">Login sessions</h2>
          <p className="mt-1 text-sm text-gray-500">Places where you&apos;re logged into RentHive.</p>
          <form action="/api/logout" method="post"><button className="mt-2 text-sm font-medium text-brand-600 hover:underline">You can sign out of all devices</button></form>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                <th className="py-3 pr-4">Location</th><th className="py-3 pr-4">Device</th><th className="py-3 pr-4">IP Address</th><th className="py-3 pr-4">Last activity</th><th></th>
              </tr></thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 text-gray-700">{s.location}</td>
                    <td className="py-3 pr-4 text-gray-600">{s.device}</td>
                    <td className="py-3 pr-4 text-gray-500">{s.ip}</td>
                    <td className="py-3 pr-4 text-gray-500">{s.last}</td>
                    <td className="py-3 text-right">{s.current ? <span className="text-gray-400">Current Session</span> : <span className="text-brand-600">Sign out</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
