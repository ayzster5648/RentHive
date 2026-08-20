import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { Icons } from "@/components/icons";

type L = { label: string; href?: string };
type Card = { icon: keyof typeof Icons; title: string; blurb: string; links: L[] };

const CARDS: Card[] = [
  { icon: "renters", title: "Account settings", blurb: "Lets you control and update account information and enable other products.", links: [
    { label: "Profile", href: "/settings/profile" }, { label: "Security", href: "/settings/security" },
    { label: "Integrations", href: "/settings/integrations" }, { label: "Notifications", href: "/settings/notifications" },
  ] },
  { icon: "dollar", title: "Subscription", blurb: "Manage your subscription, update and change the billing schedule.", links: [{ label: "My plan" }, { label: "My cards" }] },
  { icon: "reports", title: "Accounting settings", blurb: "Control the invoice posting schedule, late fee and NSF settings.", links: [
    { label: "Invoices & Late Fee", href: "/revenues" }, { label: "QuickBooks Sync" }, { label: "Tags" },
  ] },
  { icon: "dollar", title: "Online payments", blurb: "Set up how you accept payments, manage the bank accounts and other settings.", links: [{ label: "Set up", href: "/settings/integrations" }] },
  { icon: "listings", title: "Rental applications", blurb: "Manage your rental application template and other settings.", links: [
    { label: "Application fee", href: "/listings" }, { label: "Form configuration", href: "/listings" }, { label: "Terms and signature" },
  ] },
  { icon: "listings", title: "Listing website", blurb: "Manage your listing website, customize the theme and additional options.", links: [{ label: "Domain settings" }, { label: "Sitemap & style" }] },
  { icon: "renters", title: "Team management", blurb: "Control what settings, features and properties are available to your team members.", links: [{ label: "Roles & permissions" }, { label: "Property permissions" }] },
  { icon: "wrench", title: "Request settings", blurb: "Automate the requests you receive, specify the schedule and other request settings.", links: [
    { label: "Request settings", href: "/maintenance" }, { label: "Automation settings", href: "/maintenance?tab=recurring" },
  ] },
  { icon: "dollar", title: "Affiliate program", blurb: "Earn commission for recommending our product and driving leads.", links: [{ label: "Affiliate program" }] },
  { icon: "reports", title: "Report", blurb: "Review the chart of accounts, customize report layouts, and set default reporting preferences.", links: [{ label: "Layout settings", href: "/reports" }] },
];

export default async function SettingsHubPage() {
  await requireRole("LANDLORD");
  return (
    <div>
      <nav className="mb-3 text-sm text-gray-400">
        <Link href="/dashboard" className="text-brand-600 hover:underline">Dashboard</Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-gray-600">Settings</span>
      </nav>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Settings</h1>

      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c) => {
          const Icon = Icons[c.icon];
          return (
            <div key={c.title} className="border-b border-gray-100 pb-6">
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-5 w-5 text-gray-400" />
                <h2 className="font-semibold text-gray-900">{c.title}</h2>
              </div>
              <p className="mb-3 text-sm text-gray-500">{c.blurb}</p>
              <ul className="space-y-1.5">
                {c.links.map((l) => (
                  <li key={l.label}>
                    {l.href
                      ? <Link href={l.href} className="text-sm font-medium text-brand-600 hover:underline">{l.label}</Link>
                      : <span className="text-sm font-medium text-gray-300" title="Not available in this build">{l.label}</span>}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-10 text-center text-xs text-gray-400">Copyright © {new Date().getFullYear()} RentHive. All rights reserved.</p>
    </div>
  );
}
