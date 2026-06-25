import { requireRole } from "@/lib/auth";
import { paymentsConfigured } from "@/lib/integrations/payments";
import { storageConfigured } from "@/lib/integrations/storage";
import { bankConfigured } from "@/lib/integrations/bank";
import { emailConfigured } from "@/lib/integrations/notifications";
import { SettingsNav } from "../SettingsNav";

export default async function IntegrationsSettingsPage() {
  await requireRole("LANDLORD");

  const integrations = [
    { name: "Online payments", provider: "Stripe", on: paymentsConfigured(), env: "STRIPE_SECRET_KEY", desc: "Collect rent online with cards / ACH." },
    { name: "File storage", provider: "AWS S3 / R2", on: storageConfigured(), env: "S3_BUCKET", desc: "Store uploaded documents and photos." },
    { name: "Bank reconciliation", provider: "Plaid", on: bankConfigured(), env: "PLAID_CLIENT_ID", desc: "Pull bank statement lines to reconcile." },
    { name: "Email notifications", provider: "Resend", on: emailConfigured(), env: "RESEND_API_KEY", desc: "Send tenants and yourself email alerts." },
  ];

  return (
    <div className="max-w-2xl">
      <SettingsNav active="integrations" />
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900">Integrations</h2>
        <p className="mb-5 text-sm text-gray-500">
          Connect external services by setting their environment variable. Each one runs in a safe simulated mode until configured. See <code className="rounded bg-gray-100 px-1 text-xs">INTEGRATIONS.md</code> for setup steps.
        </p>
        <ul className="divide-y divide-gray-100">
          {integrations.map((i) => (
            <li key={i.name} className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-gray-900">{i.name} <span className="text-sm font-normal text-gray-400">· {i.provider}</span></p>
                <p className="text-sm text-gray-500">{i.desc}</p>
                <p className="mt-0.5 text-xs text-gray-400">Set <code className="rounded bg-gray-100 px-1">{i.env}</code> to enable.</p>
              </div>
              {i.on ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Connected</span>
              ) : (
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Simulated</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
