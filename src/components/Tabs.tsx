import Link from "next/link";
import { cn } from "@/lib/utils";

export type Tab = { key: string; label: string; href: string; badge?: string };

/** Server-rendered tab bar; `active` is the current tab key. */
export function Tabs({ tabs, active }: { tabs: Tab[]; active: string }) {
  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-gray-200">
      {tabs.map((t) => {
        const isActive = t.key === active;
        return (
          <Link
            key={t.key}
            href={t.href}
            className={cn(
              "relative -mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            )}
          >
            {t.label}
            {t.badge && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
                {t.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
