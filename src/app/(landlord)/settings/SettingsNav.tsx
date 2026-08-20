import Link from "next/link";
import { Tabs } from "@/components/Tabs";

const LABELS: Record<string, string> = { profile: "Profile", security: "Security", integrations: "Integrations", notifications: "Notifications" };

export function SettingsNav({ active }: { active: string }) {
  const tabs = [
    { key: "profile", label: "Profile", href: "/settings/profile" },
    { key: "security", label: "Security", href: "/settings/security" },
    { key: "integrations", label: "Integrations", href: "/settings/integrations" },
    { key: "notifications", label: "Notifications", href: "/settings/notifications" },
  ];
  return (
    <div>
      <nav className="mb-3 text-sm text-gray-400">
        <Link href="/dashboard" className="text-brand-600 hover:underline">Dashboard</Link>
        <span className="mx-2">/</span>
        <Link href="/settings" className="text-brand-600 hover:underline">Settings</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-600">{LABELS[active] ?? active}</span>
      </nav>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Account settings</h1>
      <Tabs tabs={tabs} active={active} />
    </div>
  );
}
