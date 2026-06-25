import { requireRole } from "@/lib/auth";
import { SettingsNav } from "../SettingsNav";
import { SecurityForm } from "./SecurityForm";

export default async function SecuritySettingsPage() {
  await requireRole("LANDLORD");
  return (
    <div className="max-w-2xl">
      <SettingsNav active="security" />
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900">Change password</h2>
        <p className="mb-5 text-sm text-gray-500">Use a strong password you don&apos;t use anywhere else.</p>
        <SecurityForm />
      </div>
    </div>
  );
}
