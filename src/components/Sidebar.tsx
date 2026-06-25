"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icons } from "./icons";
import { CreateNewMenu } from "./CreateNewMenu";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: keyof typeof Icons };
type NavGroup = { heading?: string; items: NavItem[] };

const landlordNav: NavGroup[] = [
  { items: [{ href: "/dashboard", label: "Dashboard", icon: "dashboard" }] },
  {
    heading: "Property Operations",
    items: [
      { href: "/portfolio", label: "Portfolio", icon: "home" },
      { href: "/listings", label: "Listings & Applications", icon: "listings" },
      { href: "/renters", label: "Renters", icon: "renters" },
    ],
  },
  {
    heading: "Financials",
    items: [
      { href: "/transactions", label: "Transactions", icon: "transactions" },
      { href: "/revenues", label: "Revenues", icon: "revenues" },
      { href: "/expenses", label: "Expenses", icon: "expenses" },
      { href: "/reconciliation", label: "Reconciliation", icon: "reconciliation" },
      { href: "/reports", label: "Reports", icon: "reports" },
    ],
  },
  {
    heading: "Property Services",
    items: [
      { href: "/documents", label: "Documents", icon: "documents" },
      { href: "/maintenance", label: "Maintenance", icon: "wrench" },
      { href: "/inspections", label: "Inspections", icon: "inspections" },
      { href: "/downloads", label: "Downloads", icon: "downloads" },
    ],
  },
];

const tenantNav: NavGroup[] = [
  { items: [{ href: "/portal", label: "Overview", icon: "home" }] },
  {
    heading: "My Home",
    items: [
      { href: "/portal/payments", label: "Pay Rent", icon: "dollar" },
      { href: "/portal/maintenance", label: "Maintenance", icon: "wrench" },
    ],
  },
];

export function Sidebar({
  role,
  userName,
  setupPercent = 67,
}: {
  role: "LANDLORD" | "TENANT";
  userName: string;
  setupPercent?: number;
}) {
  const pathname = usePathname();
  const groups = role === "LANDLORD" ? landlordNav : tenantNav;

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2 px-5 py-4">
        {Icons.logo({ className: "h-8 w-8" })}
        <span className="text-lg font-bold text-gray-900">RentHive</span>
      </div>

      <div className="space-y-3 px-3 pb-3">
        {role === "LANDLORD" && <CreateNewMenu />}
        {role === "LANDLORD" && (
          <Link href="/dashboard?tab=setup" className="block rounded-lg bg-brand-50 px-3 py-2.5 transition-colors hover:bg-brand-100">
            <div className="mb-1.5 flex items-center gap-2 text-sm font-medium text-brand-800">
              {Icons.renters({ className: "h-4 w-4" })}
              Finish account setup
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-100">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${setupPercent}%` }} />
              </div>
              <span className="text-xs font-semibold text-brand-700">{setupPercent}%</span>
            </div>
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 pb-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.heading && (
              <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
                {group.heading}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/portal" && item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
                const Icon = Icons[item.icon];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-brand-50 text-brand-700" : "text-gray-700 hover:bg-gray-50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? "text-brand-600" : "text-gray-400")} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {role === "LANDLORD" && (
        <div className="px-3 pb-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
              {Icons.dollar({ className: "h-4 w-4 text-brand-600" })}
              Start collecting rent online
            </div>
            <p className="mt-1 text-xs text-gray-500">Enable ACH payments to get paid faster.</p>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 p-3">
        <div className="mb-2 px-2 text-sm font-medium text-gray-900">{userName}</div>
        <form action="/api/logout" method="post">
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            {Icons.logout({ className: "h-5 w-5 text-gray-400" })}
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
