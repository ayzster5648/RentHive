import Link from "next/link";
import { Tabs } from "@/components/Tabs";

export function SettingsNav({ active }: { active: string }) {
  const tabs = [
    { key: "profile", label: "Profile", href: "/settings/profile" },
    { key: "security", label: "Security", href: "/settings/security" },
    { key: "integrations", label: "Integrations", href: "/settings/integrations" },
    { key: "notifications", label: "Notifications", href: "/settings/notifications" },
  ];
  return (
    <div>
      <Link href="/settings" className="mb-3 inline-block text-sm text-brand-600 hover:underline">← All settings</Link>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Account settings</h1>
      <Tabs tabs={tabs} active={active} />
    </div>
  );
}
