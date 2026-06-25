import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Icons } from "@/components/icons";

type Section = {
  icon: keyof typeof Icons;
  title: string;
  blurb: string;
  links: { label: string; href: string }[];
};

const sections: Section[] = [
  {
    icon: "renters",
    title: "Account settings",
    blurb: "Control and update your account information.",
    links: [
      { label: "Profile", href: "/settings/profile" },
      { label: "Security", href: "/settings/security" },
      { label: "Integrations", href: "/settings/integrations" },
      { label: "Notifications", href: "/settings/notifications" },
    ],
  },
  {
    icon: "dollar",
    title: "Online payments",
    blurb: "Set up how you accept rent payments.",
    links: [{ label: "Payment setup", href: "/settings/integrations" }],
  },
  {
    icon: "reports",
    title: "Reports",
    blurb: "Review and generate reports from your data.",
    links: [{ label: "View reports", href: "/reports" }],
  },
  {
    icon: "downloads",
    title: "Data & exports",
    blurb: "Download your data as CSV files.",
    links: [{ label: "Exports", href: "/downloads" }],
  },
];

export default async function SettingsHubPage() {
  await requireRole("LANDLORD");
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your account and how RentHive works for you." />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = Icons[s.icon];
          return (
            <div key={s.title} className="card p-5">
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-5 w-5 text-brand-600" />
                <h2 className="font-semibold text-gray-900">{s.title}</h2>
              </div>
              <p className="mb-3 text-sm text-gray-500">{s.blurb}</p>
              <ul className="space-y-1">
                {s.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm font-medium text-brand-600 hover:underline">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
